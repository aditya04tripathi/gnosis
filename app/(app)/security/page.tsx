import type { Metadata } from "next";
import { auth } from "@/auth";
import { SecuritySettings } from "@/components/security-settings";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Security Settings",
  description: "Manage your password and security settings",
};

export default async function SecurityPage() {
  const session = await auth();
  await connectDB();
  const user = await User.findById(session?.user?.id).lean();

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Security</h1>
              <p className="text-muted-foreground">
                Manage your password and security settings
              </p>
            </div>
          </div>

          <SecuritySettings user={JSON.parse(JSON.stringify(user))} />
        </div>
      </main>
    </div>
  );
}
