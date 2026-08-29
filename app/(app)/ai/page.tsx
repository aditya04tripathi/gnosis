import type { Metadata } from "next";
import {
  encryptLegacyApiKeys,
  hasEncryptedApiKey,
} from "@/modules/shared/lib/api-key-crypto";
import { auth } from "@/modules/shared/lib/auth";
import { AISettings } from "@/modules/profile/components/ai-settings";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export const metadata: Metadata = {
  title: "AI Preferences",
  description: "Choose your AI provider and configure API keys",
};

export default async function AIPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return null;
  if (encryptLegacyApiKeys(user.apiKeys)) await user.save();

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1>AI Preferences</h1>
              <p className="text-muted-foreground">
                Choose your AI provider and configure API keys
              </p>
            </div>
          </div>

          <AISettings settings={{
            provider: (user.preferences?.aiProvider || "groq") as "groq" | "openai" | "gemini" | "anthropic" | "custom" | "ollama",
            customBaseUrl: user.preferences?.customBaseUrl,
            customModel: user.preferences?.customModel,
            ollamaBaseUrl: user.preferences?.ollamaBaseUrl,
            ollamaModel: user.preferences?.ollamaModel,
          }} connected={{
            groq: hasEncryptedApiKey(user, "groq"), openai: hasEncryptedApiKey(user, "openai"), gemini: hasEncryptedApiKey(user, "gemini"), anthropic: hasEncryptedApiKey(user, "anthropic"), custom: hasEncryptedApiKey(user, "custom"),
          }} />
        </div>
      </main>
    </div>
  );
}
