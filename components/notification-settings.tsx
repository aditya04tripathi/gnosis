"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Manage what email notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="validation-email">Validation Results</Label>
              <p className="text-sm text-muted-foreground">
                Receive email when your validations are complete
              </p>
            </div>
            <Switch id="validation-email" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="project-email">Project Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about project plan improvements
              </p>
            </div>
            <Switch id="project-email" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-email">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive tips, tutorials, and product updates
              </p>
            </div>
            <Switch id="marketing-email" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Control notifications within the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-notifications">System Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications for system events
              </p>
            </div>
            <Switch id="system-notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="success-notifications">Success Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Display success messages
              </p>
            </div>
            <Switch id="success-notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
