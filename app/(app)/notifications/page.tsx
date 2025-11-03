import type { Metadata } from "next";
import { NotificationSettings } from "@/components/notification-settings";

export const metadata: Metadata = {
  title: "Notification Settings",
  description: "Manage your notification preferences",
};

export default function NotificationsPage() {
  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                Manage your notification preferences
              </p>
            </div>
          </div>

          <NotificationSettings />
        </div>
      </main>
    </div>
  );
}
