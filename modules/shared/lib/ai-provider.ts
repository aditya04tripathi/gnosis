import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq, groq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { decryptApiKey, type AIKeyProvider } from "@/modules/shared/lib/api-key-crypto";

export const GROQ_STRUCTURED_MODEL = "openai/gpt-oss-20b";
export const GROQ_CREATIVE_MODEL = "qwen/qwen3.8-27b";
export const GROQ_FAST_MODEL = "qwen/qwen3.6-27b";

export type AIModelRole = "structured" | "creative" | "fast";

const OLLAMA_DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api",
});

function ollamaSupportsThinking(modelId: string): boolean {
  const normalized = modelId.toLowerCase();
  return (
    normalized.includes("deepseek-r1") ||
    normalized.includes("qwen3") ||
    normalized.includes("qwq")
  );
}

export function getOllamaModelId(role: AIModelRole = "structured"): string {
  const byRole = {
    structured: process.env.OLLAMA_STRUCTURED_MODEL,
    creative: process.env.OLLAMA_CREATIVE_MODEL,
    fast: process.env.OLLAMA_FAST_MODEL,
  }[role];

  return byRole ?? OLLAMA_DEFAULT_MODEL;
}

export function getOllamaProviderOptions(role: AIModelRole = "fast") {
  const modelId = getOllamaModelId(role);
  if (process.env.OLLAMA_ENABLE_THINKING === "true" && ollamaSupportsThinking(modelId)) {
    return { ollama: { think: true as const } };
  }
  return undefined;
}

export function useOllama(): boolean {
  if (process.env.AI_PROVIDER === "ollama") {
    return true;
  }
  if (process.env.AI_PROVIDER === "groq") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

function getGroqModelId(role: AIModelRole): string {
  const byRole = {
    structured: GROQ_STRUCTURED_MODEL,
    creative: GROQ_CREATIVE_MODEL,
    fast: GROQ_FAST_MODEL,
  };
  return byRole[role];
}

export function getLanguageModel(role: AIModelRole = "structured"): LanguageModel {
  if (useOllama()) {
    return ollama(getOllamaModelId(role));
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq or in production");
  }

  return groq(getGroqModelId(role));
}

export function getUserLanguageModel(
  user: {
    preferences?: { aiProvider?: AIKeyProvider | "ollama"; customBaseUrl?: string; customModel?: string; ollamaModel?: string };
    apiKeys?: Partial<Record<AIKeyProvider, string | null>>;
  },
  role: AIModelRole = "structured",
): LanguageModel {
  const provider = user.preferences?.aiProvider || "groq";
  if (provider === "ollama") return ollama(user.preferences?.ollamaModel || getOllamaModelId(role));
  const encryptedKey = user.apiKeys?.[provider];
  const apiKey = encryptedKey?.startsWith("v1:") ? decryptApiKey(encryptedKey) : undefined;
  if (provider === "groq") return apiKey ? createGroq({ apiKey })(getGroqModelId(role)) : getLanguageModel(role);
  if (!apiKey) throw new Error(`Connect a ${provider} API key before using it`);
  if (provider === "openai") return createOpenAI({ apiKey })("gpt-4o-mini");
  if (provider === "anthropic") return createAnthropic({ apiKey })("claude-3-5-haiku-latest");
  if (provider === "gemini") return createGoogleGenerativeAI({ apiKey })("gemini-2.0-flash");
  if (!user.preferences?.customBaseUrl || !user.preferences.customModel) throw new Error("Configure a custom endpoint and model before using it");
  return createOpenAI({ apiKey, baseURL: user.preferences.customBaseUrl })(user.preferences.customModel);
}
