import groq from "groq-sdk";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AISettings } from "@/components/ai-settings";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "AI Preferences",
  description: "Choose your AI provider and configure API keys",
};

export default async function AIPage() {
  const session = await auth();
  await connectDB();
  const user = await User.findById(session?.user?.id).lean();
  const groqClient = new groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const groqModels = await groqClient.models.list();

  console.log(groqModels);

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AI Preferences
              </h1>
              <p className="text-muted-foreground">
                Choose your AI provider and configure API keys
              </p>
            </div>
          </div>

          <AISettings
            groqModels={groqModels.data}
            user={JSON.parse(JSON.stringify(user))}
          />
        </div>
      </main>
    </div>
  );
}
