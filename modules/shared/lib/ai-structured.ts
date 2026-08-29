import { generateText, Output } from "ai";
import type { ZodType } from "zod";
import {
  getLanguageModel,
  type AIModelRole,
} from "@/modules/shared/lib/ai-provider";
import { parseModelJson } from "@/modules/shared/lib/parse-ai-json";

export async function generateStructuredObject<T>({
  role,
  system,
  prompt,
  schema,
  temperature = 0.3,
  maxOutputTokens,
}: {
  role: AIModelRole;
  system: string;
  prompt: string;
  schema: ZodType<T>;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<T> {
  try {
    const result = await generateText({
      model: getLanguageModel(role),
      system,
      prompt,
      temperature,
      maxOutputTokens,
      output: Output.object({ schema }),
    });

    if (result.output) {
      return result.output;
    }
  } catch (error) {
    console.warn("Structured output failed, falling back to JSON parse:", error);
  }

  const { text } = await generateText({
    model: getLanguageModel(role),
    system: `${system}\n\nRespond with valid JSON only. No markdown fences, no comments, and no trailing commas.`,
    prompt,
    temperature,
    maxOutputTokens,
  });

  if (!text) {
    throw new Error("No response from AI provider");
  }

  return parseModelJson<T>(text);
}
