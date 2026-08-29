import Groq from "groq-sdk";

export {
  GROQ_CREATIVE_MODEL,
  GROQ_FAST_MODEL,
  GROQ_STRUCTURED_MODEL,
} from "@/modules/shared/lib/ai-provider";

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

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is required for Groq API access");
  }

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
