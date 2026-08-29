import Groq from "groq-sdk";

export const GROQ_STRUCTURED_MODEL = "openai/gpt-oss-20b";
export const GROQ_CREATIVE_MODEL = "qwen/qwen3-32b";
export const GROQ_FAST_MODEL = "llama-3.1-8b-instant";

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
