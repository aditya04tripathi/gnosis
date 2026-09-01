import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import {
  type AIKeyProvider,
  decryptApiKey,
} from "@/modules/shared/lib/api-key-crypto";

export const GROQ_STRUCTURED_MODEL = "openai/gpt-oss-20b";
export const GROQ_CREATIVE_MODEL = "qwen/qwen3.8-27b";
export const GROQ_FAST_MODEL = "qwen/qwen3.6-27b";

export type AIModelRole = "structured" | "creative" | "fast";

const OLLAMA_DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";

const DEFAULT_OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/api";

const ollama = createOllama({ baseURL: DEFAULT_OLLAMA_BASE_URL });

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
  if (
    process.env.OLLAMA_ENABLE_THINKING === "true" &&
    ollamaSupportsThinking(modelId)
  ) {
    return { ollama: { think: true as const } };
  }
  return undefined;
}

export function shouldUseOllama(): boolean {
  return process.env.AI_PROVIDER === "ollama";
}

function getServerGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required for Groq");
  }
  return apiKey;
}

function getGroqLanguageModel(
  role: AIModelRole,
  apiKey?: string,
): LanguageModel {
  const resolvedKey = apiKey ?? getServerGroqApiKey();
  return createGroq({ apiKey: resolvedKey })(getGroqModelId(role));
}

function getGroqModelId(role: AIModelRole): string {
  const byRole = {
    structured: GROQ_STRUCTURED_MODEL,
    creative: GROQ_CREATIVE_MODEL,
    fast: GROQ_FAST_MODEL,
  };
  return byRole[role];
}

export function getLanguageModel(
  role: AIModelRole = "structured",
): LanguageModel {
  if (shouldUseOllama()) {
    return ollama(getOllamaModelId(role));
  }

  return getGroqLanguageModel(role);
}

export function getUserLanguageModel(
  user: {
    preferences?: {
      aiProvider?: AIKeyProvider | "ollama";
      customBaseUrl?: string;
      customModel?: string;
      ollamaBaseUrl?: string;
      ollamaModel?: string;
    };
    apiKeys?: Partial<Record<AIKeyProvider, string | null>>;
  },
  role: AIModelRole = "structured",
): LanguageModel {
  const provider = user.preferences?.aiProvider || "groq";
  if (provider === "ollama") {
    const baseURL = user.preferences?.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL;
    return createOllama({ baseURL })(
      user.preferences?.ollamaModel || getOllamaModelId(role),
    );
  }
  const encryptedKey = user.apiKeys?.[provider];
  const apiKey = encryptedKey?.startsWith("v1:")
    ? decryptApiKey(encryptedKey)
    : undefined;
  if (provider === "groq") {
    return getGroqLanguageModel(role, apiKey);
  }
  if (!apiKey) throw new Error(`Connect a ${provider} API key before using it`);
  if (provider === "openai") return createOpenAI({ apiKey })("gpt-4o-mini");
  if (provider === "anthropic")
    return createAnthropic({ apiKey })("claude-3-5-haiku-latest");
  if (provider === "gemini")
    return createGoogleGenerativeAI({ apiKey })("gemini-2.0-flash");
  if (!user.preferences?.customBaseUrl || !user.preferences.customModel)
    throw new Error("Configure a custom endpoint and model before using it");
  return createOpenAI({ apiKey, baseURL: user.preferences.customBaseUrl })(
    user.preferences.customModel,
  );
}
