"use client";

import {
  Flag,
  LayoutGrid,
  LayoutList,
  Users,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { IssuesPanel } from "@/modules/project/components/issues-panel";
import { MilestonesPanel } from "@/modules/project/components/milestones-panel";
import { ProjectBoards } from "@/modules/project/components/project-boards";
import { ProjectFlowchart } from "@/modules/project/components/project-flowchart";
import { TeamPanel } from "@/modules/project/components/team-panel";
import type {
  MilestoneData,
  ProjectIssueData,
  TeamMemberData,
} from "@/modules/project/types/project.types";
import { cn } from "@/modules/shared/lib/utils";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

type WorkspaceView = "list" | "board" | "roadmap" | "milestones" | "team";

const PRIMARY_VIEWS: {
  id: WorkspaceView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "list", label: "List", icon: LayoutList },
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "roadmap", label: "Roadmap", icon: Workflow },
];

const SECONDARY_VIEWS: {
  id: WorkspaceView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "milestones", label: "Milestones", icon: Flag },
  { id: "team", label: "Team", icon: Users },
];

interface ProjectWorkspaceProps {
  projectPlanId: string;
  plan: ProjectPlan;
  issues: ProjectIssueData[];
  milestones: MilestoneData[];
  phases: { id: string; name: string }[];
  members: TeamMemberData[];
  githubProjectUrl?: string;
}

export function ProjectWorkspace({
  projectPlanId,
  plan,
  issues,
  milestones,
  phases,
  members,
  githubProjectUrl,
}: ProjectWorkspaceProps) {
  const [view, setView] = useState<WorkspaceView>("board");

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="flex flex-col gap-3 border-b px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {PRIMARY_VIEWS.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                  key={item.id}
                  onClick={() => setView(item.id)}
                  type="button"
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
            <span className="mx-1 text-muted-foreground">|</span>
            {SECONDARY_VIEWS.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                  key={item.id}
                  onClick={() => setView(item.id)}
                  type="button"
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          {githubProjectUrl ? (
            <a
              className="text-primary text-sm hover:underline"
              href={githubProjectUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open in GitHub Projects →
            </a>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          Filter by keyword or by field in each view. Synced with GitHub when
          connected.
        </p>
      </div>

      <div className="p-4">
        {view === "list" ? (
          <IssuesPanel
            issues={issues}
            layout="table"
            milestones={milestones.map((m) => ({ id: m.id, title: m.title }))}
            phases={phases}
            projectPlanId={projectPlanId}
          />
        ) : null}

        {view === "board" ? (
          <ProjectBoards embedded plan={plan} projectPlanId={projectPlanId} />
        ) : null}

        {view === "roadmap" ? (
          <div className="min-h-[520px] rounded-lg border bg-muted/10 p-4">
            <ProjectFlowchart
              milestones={milestones.map((m) => ({
                id: m.id,
                title: m.title,
                phaseId: m.phaseId,
              }))}
              plan={plan}
            />
          </div>
        ) : null}

        {view === "milestones" ? (
          <MilestonesPanel
            milestones={milestones}
            phases={phases}
            projectPlanId={projectPlanId}
          />
        ) : null}

        {view === "team" ? (
          <TeamPanel members={members} projectPlanId={projectPlanId} />
        ) : null}
      </div>
    </div>
  );
}
