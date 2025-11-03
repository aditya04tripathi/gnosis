import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProfileSettings } from "@/components/profile-settings";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your personal information",
};

export default async function ProfilePage() {
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
              <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
              <p className="text-muted-foreground">
                Manage your personal information
              </p>
            </div>
          </div>

          <ProfileSettings user={JSON.parse(JSON.stringify(user))} />
        </div>
      </main>
    </div>
  );
}
