export type IssueType =
  | "bug"
  | "feature"
  | "task"
  | "epic"
  | "chore"
  | "docs"
  | "spike";

export type IssueStatus = "open" | "in_progress" | "done" | "closed";

export type TeamRole = "owner" | "admin" | "member" | "viewer";

export interface IssueComment {
  id: string;
  userId: string;
  userName: string;
  body: string;
  githubCommentId?: number;
  createdAt: string;
}

export interface ProjectIssueData {
  _id: string;
  projectPlanId: string;
  number: number;
  title: string;
  body: string;
  type: IssueType;
  status: IssueStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  labels: string[];
  assigneeEmail?: string;
  milestoneId?: string;
  phaseId?: string;
  linkedTaskId?: string;
  githubIssueNumber?: number;
  comments: IssueComment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneData {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  status: "open" | "closed";
  phaseId?: string;
}

export interface TeamMemberData {
  userId?: string;
  email: string;
  role: TeamRole;
  name?: string;
  invitedAt: string;
}

export const ISSUE_TYPE_CONFIG: Record<
  IssueType,
  { label: string; color: string; icon: string }
> = {
  bug: { label: "Bug", color: "bg-rose-500/15 text-rose-600", icon: "🐛" },
  feature: {
    label: "Feature",
    color: "bg-violet-500/15 text-violet-600",
    icon: "✨",
  },
  task: { label: "Task", color: "bg-sky-500/15 text-sky-600", icon: "📋" },
  epic: { label: "Epic", color: "bg-amber-500/15 text-amber-600", icon: "🎯" },
  chore: { label: "Chore", color: "bg-slate-500/15 text-slate-600", icon: "🔧" },
  docs: { label: "Docs", color: "bg-emerald-500/15 text-emerald-600", icon: "📖" },
  spike: { label: "Spike", color: "bg-orange-500/15 text-orange-600", icon: "🔬" },
};
