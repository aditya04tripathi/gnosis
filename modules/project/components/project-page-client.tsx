"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { ProjectAiChatProvider } from "@/modules/project/components/project-ai-chat-provider";
import { ProjectHeader } from "@/modules/project/components/project-header";
import { ProjectWorkspace } from "@/modules/project/components/project-workspace";
import { GitHubSyncPanel } from "@/modules/github/components/github-sync-panel";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";
import type {
  MilestoneData,
  ProjectIssueData,
  TeamMemberData,
} from "@/modules/project/types/project.types";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

interface SerializedGithub {
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
}

interface ProjectPageClientProps {
  projectPlanId: string;
  plan: ProjectPlan;
  issues: ProjectIssueData[];
  milestones: MilestoneData[];
  phases: { id: string; name: string }[];
  members: TeamMemberData[];
  github: SerializedGithub | null;
  githubConfigured: boolean;
  githubConnected: boolean;
  githubUsername?: string | null;
  missingScopes?: string[];
  needsReconnect?: boolean;
  reconnectMessage?: string | null;
  grantedScopes?: string[];
  openIssues: number;
  estimatedDuration: string;
  estimatedCost: string;
  riskLevel: string;
}

export function ProjectPageClient({
  projectPlanId,
  plan,
  issues,
  milestones,
  phases,
  members,
  github,
  githubConfigured,
  githubConnected,
  githubUsername,
  missingScopes,
  needsReconnect,
  reconnectMessage,
  grantedScopes,
  openIssues,
  estimatedDuration,
  estimatedCost,
  riskLevel,
}: ProjectPageClientProps) {
  return (
    <ProjectAiChatProvider plan={plan} projectPlanId={projectPlanId}>
      <div className="flex h-full flex-col pb-24">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/dashboard">
                <Button variant="ghost">← Portfolio</Button>
              </Link>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`/api/export/project/${projectPlanId}?format=csv`}>
                    <Download className="size-4" />
                    Export CSV
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`/api/export/project/${projectPlanId}`} target="_blank">
                    <Download className="size-4" />
                    Export JSON
                  </a>
                </Button>
              </div>
            </div>
            <ProjectHeader />
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{openIssues} open issues</Badge>
              <Badge variant="outline">
                {milestones.filter((m) => m.status === "open").length} milestones
              </Badge>
              <Badge variant="outline">{members.length} team</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h4>Duration</h4>
                </CardTitle>
              </CardHeader>
              <CardContent>{estimatedDuration}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <h4>Cost</h4>
                </CardTitle>
              </CardHeader>
              <CardContent>{estimatedCost}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <h4>Risk</h4>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{riskLevel}</Badge>
              </CardContent>
            </Card>
          </div>

          <GitHubSyncPanel
            github={github}
            githubConfigured={githubConfigured}
            githubConnected={githubConnected}
            githubUsername={githubUsername}
            grantedScopes={grantedScopes}
            missingScopes={missingScopes}
            needsReconnect={needsReconnect}
            projectPlanId={projectPlanId}
            reconnectMessage={reconnectMessage}
          />

          <ProjectWorkspace
            githubProjectUrl={github?.project?.url}
            issues={issues}
            members={members}
            milestones={milestones}
            phases={phases}
            plan={plan}
            projectPlanId={projectPlanId}
          />
        </div>
      </div>
    </ProjectAiChatProvider>
  );
}
