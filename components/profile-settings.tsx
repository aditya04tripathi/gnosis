"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAccount } from "@/actions/auth";
import { updateProfile } from "@/actions/profile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface ProfileSettingsProps {
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      const result = await deleteAccount();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Account deleted successfully!");
        router.replace("/");
      }
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);

      const result = await updateProfile(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully!");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {name[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{name}</h3>
                <p className="text-sm text-muted-foreground">{email}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <p>
                      Are you sure you want to delete your account? This will
                      permanently delete your account and all associated data,
                      including all your projects, validations, invoices, and
                      more.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, keep my account.</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      onClick={handleDeleteAccount}
                      type="button"
                      variant="destructive"
                      className="text-destructive-foreground"
                    >
                      Yes, delete my account permanently.
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
