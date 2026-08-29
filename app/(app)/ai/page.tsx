import groq from "groq-sdk";
import type { Metadata } from "next";
import { auth } from "@/modules/shared/lib/auth";
import { useOllama } from "@/modules/shared/lib/ai-provider";
import { AISettings } from "@/modules/profile/components/ai-settings";
import connectDB from "@/modules/shared/lib/db";
import User from "@/modules/shared/models/User";

export const metadata: Metadata = {
  title: "AI Preferences",
  description: "Choose your AI provider and configure API keys",
};

export default async function AIPage() {
  const session = await auth();
  await connectDB();
  const user = await User.findById(session?.user?.id).lean();

  const groqModels = useOllama()
    ? []
    : (
        await new groq({
          apiKey: process.env.GROQ_API_KEY,
        }).models.list()
      ).data;

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1>AI Preferences</h1>
              <p className="text-muted-foreground">
                {useOllama()
                  ? "Local development uses Ollama. Groq is enabled in production."
                  : "Choose your AI provider and configure API keys"}
              </p>
            </div>
          </div>

          <AISettings
            groqModels={groqModels}
            user={JSON.parse(JSON.stringify(user))}
          />
        </div>
      </main>
    </div>
  );
}
