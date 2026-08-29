"use client";

import { Github, Link2, Loader2, RefreshCw, Trash2, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getProjectGitHubSyncStatus,
  linkGitHubRepository,
  syncProjectWithGitHub,
  unlinkGitHubRepository,
} from "@/modules/github/actions/github";
import { deleteProject } from "@/modules/project/actions/project";
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
import { Progress } from "@/modules/shared/components/ui/progress";

interface GitHubSyncPanelProps {
  projectPlanId: string;
  github?: {
    owner: string;
    repo: string;
    enabled: boolean;
    lastSyncedAt?: string;
    syncStatus?: {
      status: "queued" | "running" | "completed" | "failed";
      stage?: string;
      progress?: { current: number; total: number };
      error?: string;
      completedAt?: string;
    };
    project?: {
      url: string;
      number: number;
    };
  } | null;
  githubConfigured: boolean;
  githubConnected: boolean;
  githubUsername?: string | null;
  needsReconnect?: boolean;
  reconnectMessage?: string | null;
  missingScopes?: string[];
  grantedScopes?: string[];
}

export function GitHubSyncPanel({
  projectPlanId,
  github,
  githubConfigured,
  githubConnected,
  githubUsername,
  needsReconnect,
  reconnectMessage,
  missingScopes,
  grantedScopes,
}: GitHubSyncPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [owner, setOwner] = useState(github?.owner ?? githubUsername ?? "");
  const [repo, setRepo] = useState(github?.repo ?? "");
  const [syncStatus, setSyncStatus] = useState(github?.syncStatus ?? null);
  const [lastSyncedAt, setLastSyncedAt] = useState(github?.lastSyncedAt);

  const isSyncing =
    syncStatus?.status === "queued" || syncStatus?.status === "running";

  const pollSyncStatus = useCallback(async () => {
    const result = await getProjectGitHubSyncStatus(projectPlanId);
    if ("error" in result && result.error) {
      return;
    }
    if (!("success" in result) || !result.success) {
      return;
    }

    if (result.syncStatus) {
      setSyncStatus(result.syncStatus);
    }
    if (result.lastSyncedAt) {
      setLastSyncedAt(result.lastSyncedAt);
    }

    if (
      result.activeJob?.status === "completed" ||
      result.syncStatus?.status === "completed"
    ) {
      router.refresh();
    }
  }, [projectPlanId, router]);

  useEffect(() => {
    if (!isSyncing) {
      return;
    }

    const interval = setInterval(() => {
      void pollSyncStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [isSyncing, pollSyncStatus]);

  const connectGitHub = () => {
    window.location.href = `/api/github/connect?redirect=${encodeURIComponent(`/project/${projectPlanId}`)}`;
  };

  const reconnectGitHub = () => {
    toast.message(
      "GitHub will ask you to approve Projects access. If it does not, revoke Gnosis from GitHub Settings → Applications first.",
    );
    connectGitHub();
  };

  const handleLinkRepo = () => {
    startTransition(async () => {
      const result = await linkGitHubRepository(projectPlanId, owner, repo);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        "Repository linked. Starting two-way sync with GitHub.",
      );
      setSyncStatus({ status: "queued", stage: "Queued" });
      router.refresh();
    });
  };

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncProjectWithGitHub(projectPlanId);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Syncing with GitHub");
      setSyncStatus({ status: "queued", stage: "Queued" });
      void pollSyncStatus();
    });
  };

  const handleUnlink = () => {
    startTransition(async () => {
      const result = await unlinkGitHubRepository(projectPlanId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("GitHub repository unlinked");
      setSyncStatus(null);
      router.refresh();
    });
  };

  const handleDeleteProject = () => {
    startTransition(async () => {
      const result = await deleteProject(projectPlanId);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  const progressPercent =
    syncStatus?.progress && syncStatus.progress.total > 0
      ? Math.round(
          (syncStatus.progress.current / syncStatus.progress.total) * 100,
        )
      : isSyncing
        ? 10
        : 0;

  if (!githubConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Github className="size-4" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to enable syncing.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Github className="size-4" />
              GitHub Integration
            </CardTitle>
            <CardDescription>
              Link a repository and keep tasks, issues, milestones, and board
              status in sync between Gnosis and GitHub.
            </CardDescription>
          </div>
          {githubConnected ? (
            <Badge variant="secondary">@{githubUsername}</Badge>
          ) : (
            <Button onClick={connectGitHub} size="sm" variant="outline">
              <Github className="size-4" />
              Connect GitHub
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsReconnect ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-300">
              GitHub Projects permission required
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              {reconnectMessage ??
                `Missing scopes: ${missingScopes?.join(", ") ?? "project"}. Issues and milestones still sync; Projects board needs a reconnect.`}
            </p>
            {grantedScopes && grantedScopes.length > 0 ? (
              <p className="mt-1 text-muted-foreground text-xs">
                Granted: {grantedScopes.join(", ")}
              </p>
            ) : null}
            <Button
              className="mt-3"
              onClick={reconnectGitHub}
              size="sm"
              variant="outline"
            >
              Reconnect GitHub
            </Button>
          </div>
        ) : null}
        {!githubConnected ? (
          <p className="text-muted-foreground text-sm">
            Connect your GitHub account to sync a repository with this project.
          </p>
        ) : github?.owner && github.repo ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={isPending || isSyncing}
                onClick={handleSync}
              >
                {isSyncing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {isSyncing ? "Syncing…" : "Sync"}
              </Button>
              <Button
                disabled={isPending || isSyncing}
                onClick={handleUnlink}
                variant="outline"
              >
                <Unlink className="size-4" />
                Unlink repo
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isPending || isSyncing} variant="destructive">
                    <Trash2 className="size-4" />
                    Delete project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the project, issues, board,
                      and sync history from Gnosis. Your GitHub repository
                      is not affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProject}>
                      Delete project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="github-owner">Owner</Label>
                <Input
                  id="github-owner"
                  onChange={(event) => setOwner(event.target.value)}
                  placeholder="octocat"
                  value={owner}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-repo">Repository</Label>
                <Input
                  id="github-repo"
                  onChange={(event) => setRepo(event.target.value)}
                  placeholder="hello-world"
                  value={repo}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={isPending || !owner || !repo} onClick={handleLinkRepo}>
                <Link2 className="size-4" />
                Link repository
              </Button>
            </div>
          </>
        )}

        {githubConnected && github?.owner && github.repo ? (
          <>
            {isSyncing || syncStatus?.status === "failed" ? (
              <div className="space-y-2 rounded-md border bg-muted/30 px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {syncStatus?.status === "failed"
                      ? "Sync failed"
                      : syncStatus?.stage ?? "Syncing"}
                  </span>
                  {syncStatus?.progress?.total ? (
                    <span className="text-muted-foreground text-xs">
                      {syncStatus.progress.current}/{syncStatus.progress.total}
                    </span>
                  ) : null}
                </div>
                <Progress value={progressPercent} />
                {syncStatus?.error ? (
                  <p className="text-destructive text-xs">{syncStatus.error}</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p>
                Linked to{" "}
                <a
                  className="font-medium text-primary hover:underline"
                  href={`https://github.com/${github.owner}/${github.repo}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {github.owner}/{github.repo}
                </a>
              </p>
              {github.project?.url ? (
                <p>
                  GitHub Project:{" "}
                  <a
                    className="font-medium text-primary hover:underline"
                    href={github.project.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Board · List · Roadmap
                  </a>
                </p>
              ) : null}
              {lastSyncedAt ? (
                <p className="text-muted-foreground text-xs">
                  Last synced {new Date(lastSyncedAt).toLocaleString()}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Not synced yet — run Sync to exchange changes with GitHub
                </p>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
