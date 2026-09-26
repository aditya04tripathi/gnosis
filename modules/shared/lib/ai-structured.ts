import { generateText, Output } from "ai";
import type { LanguageModel } from "ai";
import type { ZodType } from "zod";
import {
  getLanguageModel,
  type AIModelRole,
} from "@/modules/shared/lib/ai-provider";
import { parseModelJson } from "@/modules/shared/lib/parse-ai-json";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    (error as any).message ||
    (error as any).data?.error?.message ||
    (error as any).cause?.message ||
    "";
  return (
    typeof message === "string" &&
    (message.includes("invalid JSON schema") ||
      message.includes("response_format") ||
      message.includes("schema") ||
      message.includes("is required to be supplied"))
  );
}

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return true;
  const status = (error as any).statusCode || (error as any).status;
  if (status === 400 && isSchemaError(error)) return false; // Handled by mode switch
  if (status === 401 || status === 403) return false;
  return true;
}

export async function generateStructuredObject<T>({
  role,
  system,
  prompt,
  schema,
  temperature = 0.3,
  maxOutputTokens,
  model,
  maxRetries = 3,
}: {
  role: AIModelRole;
  system: string;
  prompt: string;
  schema: ZodType<T>;
  temperature?: number;
  maxOutputTokens?: number;
  model?: LanguageModel;
  maxRetries?: number;
}): Promise<T> {
  const selectedModel = model || getLanguageModel(role);
  let useFallbackMode = false;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!useFallbackMode) {
        try {
          const result = await generateText({
            model: selectedModel,
            system,
            prompt,
            temperature,
            maxOutputTokens,
            output: Output.object({ schema }),
          });

          if (result.output) {
            return result.output;
          }
        } catch (structuredError) {
          lastError = structuredError;
          if (isSchemaError(structuredError)) {
            console.warn(
              `[ai-structured] Provider rejected JSON schema format. Switching to direct JSON mode for retry (attempt ${attempt}/${maxRetries}):`,
              (structuredError as any)?.message || structuredError,
            );
            useFallbackMode = true;
          } else {
            console.warn(
              `[ai-structured] Native structured output attempt ${attempt}/${maxRetries} failed:`,
              (structuredError as any)?.message || structuredError,
            );
          }
        }
      }

      // Fallback JSON mode: prompt for JSON directly and parse
      const { text } = await generateText({
        model: selectedModel,
        system: `${system}\n\nCRITICAL: Respond with a single valid JSON object strictly conforming to the requested schema. Output valid JSON ONLY without any markdown fences, explanations, comments, or trailing commas.`,
        prompt,
        temperature,
        maxOutputTokens,
      });

      if (!text) {
        throw new Error("Empty response received from AI provider");
      }

      const parsedJson = parseModelJson<T>(text);
      const validationResult = schema.safeParse(parsedJson);
      if (validationResult.success) {
        return validationResult.data;
      }

      lastError = new Error(
        `Generated JSON failed schema validation: ${validationResult.error.message}`,
      );
      console.warn(
        `[ai-structured] Schema validation failed on parsed JSON (attempt ${attempt}/${maxRetries}):`,
        validationResult.error.issues,
      );
    } catch (error) {
      lastError = error;
      console.warn(
        `[ai-structured] Error during generation attempt ${attempt}/${maxRetries}:`,
        (error as any)?.message || error,
      );

      if (!isRetryableError(error) && attempt >= maxRetries) {
        throw error;
      }
    }

    if (attempt < maxRetries) {
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
      console.log(`[ai-structured] Retrying attempt ${attempt + 1}/${maxRetries} in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to generate valid structured object after ${maxRetries} attempts`);
}
