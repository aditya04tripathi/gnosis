import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("Please add GROQ_API_KEY to your environment variables");
}

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 30000,
      maxRetries: 2,
    });
  }
  return groqInstance;
}

export function resetGroqClient(): void {
  groqInstance = null;
}
