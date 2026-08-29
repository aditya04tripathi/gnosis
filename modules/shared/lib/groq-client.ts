import Groq from "groq-sdk";

export const GROQ_STRUCTURED_MODEL = "openai/gpt-oss-20b";
export const GROQ_CREATIVE_MODEL = "qwen/qwen3.8-27b";
export const GROQ_FAST_MODEL = "qwen/qwen3.6-27b";

const CHARS_PER_TOKEN = 4;

const IDEA_INPUT_BUDGETS = [
  {
    contextTokens: 131_072,
    maxOutputTokens: 8_192,
    promptOverheadTokens: 3_000,
  },
  {
    contextTokens: 128_000,
    maxOutputTokens: 2_048,
    promptOverheadTokens: 1_200,
  },
] as const;

export function getMaxIdeaInputTokens(): number {
  return Math.min(
    ...IDEA_INPUT_BUDGETS.map(
      (budget) =>
        budget.contextTokens -
        budget.maxOutputTokens -
        budget.promptOverheadTokens,
    ),
  );
}

export function getMaxIdeaChars(): number {
  return getMaxIdeaInputTokens() * CHARS_PER_TOKEN;
}

export function clipIdeaText(idea: string): string {
  const trimmed = idea.trim();
  const maxChars = getMaxIdeaChars();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return trimmed.slice(0, maxChars);
}

if (!process.env.GROQ_API_KEY) {
  throw new Error("Please add GROQ_API_KEY to your environment variables");
}

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 120_000,
      maxRetries: 2,
    });
  }
  return groqInstance;
}

export function resetGroqClient(): void {
  groqInstance = null;
}
