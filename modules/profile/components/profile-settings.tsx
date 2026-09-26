"use client";

import {
  CreditCard,
  ExternalLink,
  Github,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAccount } from "@/modules/auth/actions/auth";
import { disconnectGitHubAccount } from "@/modules/github/actions/github";
import { updateProfile } from "@/modules/profile/actions/profile";
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
} from "@/modules/shared/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/modules/shared/components/ui/avatar";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";
import { Input } from "@/modules/shared/components/ui/input";
import { Label } from "@/modules/shared/components/ui/label";
import {
  SUBSCRIPTION_PLANS,
  getPlanForTier,
  getSearchLimitForTier,
} from "@/modules/shared/constants";

interface ProfileSettingsProps {
  user: {
    _id: string;
    name: string;
    email: string;
    subscriptionTier?: "FREE" | "MONTHLY" | "YEARLY" | "ULTRA";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    searchesUsed?: number;
    searchesResetAt?: string | Date;
    githubUsername?: string | null;
    githubConnectedAt?: string | Date | null;
    githubScopes?: string[];
  };
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [name, setName] = useState(user.name);
  const [email] = useState(user.email);

  const currentTier = user.subscriptionTier || "FREE";
  const plan = getPlanForTier(currentTier);
  const limit = getSearchLimitForTier(currentTier);
  const isGitHubConnected = Boolean(user.githubUsername);

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

  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
          return;
        }
        throw new Error(data.error || "Failed to open billing portal");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Billing portal error:", error);
      toast.error(
        error instanceof Error ? error.message : "Unable to access billing portal",
      );
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    setIsGithubLoading(true);
    try {
      const result = await disconnectGitHubAccount();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("GitHub account disconnected");
        router.refresh();
      }
    } catch {
      toast.error("Failed to disconnect GitHub account");
    } finally {
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {name[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="text-sm text-muted-foreground">{email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={currentTier === "FREE" ? "secondary" : "default"}>
                    {plan.name}
                  </Badge>
                  {isGitHubConnected && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Github className="w-3 h-3" />
                      @{user.githubUsername}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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

      {/* Subscription & Billing Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Subscription & Billing
              </CardTitle>
              <CardDescription>
                Manage your Gnosis subscription tier, quotas, and Stripe payment methods
              </CardDescription>
            </div>
            <Badge
              variant={currentTier === "FREE" ? "outline" : "default"}
              className="text-xs font-semibold px-2.5 py-0.5"
            >
              {plan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">Current Plan</p>
                <p className="text-base font-bold mt-0.5">{plan.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.price} {plan.period}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Validation Allotment</p>
                <p className="text-base font-bold mt-0.5">
                  {limit === Infinity ? "Unlimited" : `${limit} per period`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.searchesUsed || 0} validations used
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billing Status</p>
                <p className="text-base font-bold text-primary mt-0.5">
                  {currentTier === "FREE" ? "Active (Free)" : "Active Subscriber"}
                </p>
                {user.searchesResetAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Resets {new Date(user.searchesResetAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-muted-foreground">
                {currentTier === "FREE"
                  ? "Upgrade to Pro or Annual to unlock 50+ validations and bi-directional GitHub sync."
                  : "Update credit cards, view invoices, or change your billing frequency via Stripe Portal."}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {currentTier === "FREE" ? (
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/pricing">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Link>
                  </Button>
                ) : (
                  <Button
                    onClick={handleManageBilling}
                    disabled={isBillingLoading}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {isBillingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Manage in Stripe Portal
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5 text-primary" />
                GitHub Integration
              </CardTitle>
              <CardDescription>
                Connect your GitHub account to sync project plans, roadmap milestones, and issues directly to your repositories
              </CardDescription>
            </div>
            <Badge variant={isGitHubConnected ? "default" : "secondary"}>
              {isGitHubConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isGitHubConnected ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-background border border-border">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://github.com/${user.githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-sm hover:underline flex items-center gap-1"
                      >
                        @{user.githubUsername}
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    </div>
                    {user.githubConnectedAt && (
                      <p className="text-xs text-muted-foreground">
                        Connected on{" "}
                        {new Date(user.githubConnectedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href="/api/github/connect?redirect=/profile">
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Re-authenticate
                    </a>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnectGitHub}
                    disabled={isGithubLoading}
                  >
                    {isGithubLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : null}
                    Disconnect
                  </Button>
                </div>
              </div>

              {user.githubScopes && user.githubScopes.length > 0 && (
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-foreground">Granted scopes:</span>
                  {user.githubScopes.map((scope, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-muted font-mono text-[11px]"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 border border-border/40">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                No GitHub account connected. Connect now to push tasks as GitHub Issues and link roadmaps to repository milestones.
              </div>
              <Button asChild className="w-full sm:w-auto shrink-0">
                <a href="/api/github/connect?redirect=/profile">
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/60">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive account actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated startup validations, project plans, and credentials
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm">
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
                      including all your projects, validations, and credentials.
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
