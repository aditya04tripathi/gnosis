"use client";

import {
  Bug,
  CheckCircle2,
  Filter,
  MessageSquare,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  addIssueComment,
  createProjectIssue,
  removeIssueComment,
  updateProjectIssue,
} from "@/modules/project/actions/issues";
import {
  ISSUE_TYPE_CONFIG,
  type IssueComment,
  type IssueStatus,
  type IssueType,
  type ProjectIssueData,
} from "@/modules/project/types/project.types";
import { stripGnosisSyncFooter } from "@/modules/github/lib/gnosis-attribution";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/modules/shared/components/ui/dialog";
import { Input } from "@/modules/shared/components/ui/input";
import { Label } from "@/modules/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shared/components/ui/select";
import { Textarea } from "@/modules/shared/components/ui/textarea";
import { MarkdownContent } from "@/modules/shared/components/markdown-content";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/shared/components/ui/table";
import { useOptimisticAction } from "@/modules/shared/hooks/use-optimistic-action";
import { cn } from "@/modules/shared/lib/utils";

const ISSUE_TYPES = Object.keys(ISSUE_TYPE_CONFIG) as IssueType[];

interface IssuesPanelProps {
  projectPlanId: string;
  issues: ProjectIssueData[];
  phases: { id: string; name: string }[];
  milestones: { id: string; title: string }[];
  layout?: "list" | "table";
}

function IssueTypeBadge({ type }: { type: IssueType }) {
  const config = ISSUE_TYPE_CONFIG[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-[10px]",
        config.color,
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

function CreateIssueDialog({
  projectPlanId,
  phases,
  milestones,
  onCreated,
}: {
  projectPlanId: string;
  phases: { id: string; name: string }[];
  milestones: { id: string; title: string }[];
  onCreated: (issue: ProjectIssueData) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<IssueType>("task");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [phaseId, setPhaseId] = useState<string>("none");
  const [milestoneId, setMilestoneId] = useState<string>("none");

  const handleCreate = () => {
    if (!title.trim()) return;

    const tempIssue: ProjectIssueData = {
      _id: `temp-${nanoid()}`,
      projectPlanId,
      number: 0,
      title: title.trim(),
      body: body.trim(),
      type,
      status: "open",
      priority,
      labels: [],
      milestoneId: milestoneId === "none" ? undefined : milestoneId,
      phaseId: phaseId === "none" ? undefined : phaseId,
      comments: [],
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreated(tempIssue);
    setOpen(false);
    setTitle("");
    setBody("");

    void createProjectIssue(projectPlanId, {
      title: tempIssue.title,
      body: tempIssue.body,
      type,
      priority,
      phaseId: tempIssue.phaseId,
      milestoneId: tempIssue.milestoneId,
    }).then((result) => {
      if (result.error) return;
      router.refresh();
    });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create issue</DialogTitle>
          <DialogDescription>
            Report a bug, request a feature, or track work.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select onValueChange={(v) => setType(v as IssueType)} value={type}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ISSUE_TYPE_CONFIG[t].icon} {ISSUE_TYPE_CONFIG[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                onValueChange={(v) =>
                  setPriority(v as "LOW" | "MEDIUM" | "HIGH")
                }
                value={priority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary"
              value={title}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              className="min-h-[100px]"
              onChange={(e) => setBody(e.target.value)}
              placeholder="Markdown supported"
              value={body}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select onValueChange={setPhaseId} value={phaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Milestone</Label>
              <Select onValueChange={setMilestoneId} value={milestoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {milestones.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!title.trim()} onClick={handleCreate}>
            Create issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IssueDetail({
  issue,
  projectPlanId,
  onClose,
  onUpdate,
}: {
  issue: ProjectIssueData;
  projectPlanId: string;
  onClose: () => void;
  onUpdate: (issue: ProjectIssueData) => void;
}) {
  const router = useRouter();
  const { value: localIssue, run } = useOptimisticAction(issue);
  const [comment, setComment] = useState("");

  const handleStatusChange = (status: IssueStatus) => {
    void run(
      (current) => ({ ...current, status }),
      () => updateProjectIssue(projectPlanId, issue._id, { status }),
    ).then((result) => {
      if (!result.error) {
        onUpdate({ ...localIssue, status });
        router.refresh();
      }
    });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    const draft = comment.trim();
    const optimisticComment: IssueComment = {
      id: `temp-${nanoid()}`,
      userId: "",
      userName: "You",
      body: draft,
      createdAt: new Date().toISOString(),
    };

    void run(
      (current) => ({
        ...current,
        comments: [...current.comments, optimisticComment],
      }),
      () => addIssueComment(projectPlanId, issue._id, draft),
    ).then((result) => {
      if (!result.error) {
        setComment("");
        onUpdate({
          ...localIssue,
          comments: [...localIssue.comments, optimisticComment],
        });
        router.refresh();
      }
    });
  };

  const handleRemoveComment = (commentId: string) => {
    void run(
      (current) => ({
        ...current,
        comments: current.comments.filter((item) => item.id !== commentId),
      }),
      () => removeIssueComment(projectPlanId, issue._id, commentId),
    ).then((result) => {
      if (!result.error) {
        onUpdate({
          ...localIssue,
          comments: localIssue.comments.filter((item) => item.id !== commentId),
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-muted-foreground">#{issue.number}</span>
          <IssueTypeBadge type={localIssue.type} />
        </div>
        <Button onClick={onClose} size="sm" variant="ghost">
          Close
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <h2 className="font-semibold text-lg leading-snug">{localIssue.title}</h2>
        <div className="flex flex-wrap gap-2">
          {localIssue.status !== "done" && localIssue.status !== "closed" ? (
            <Button onClick={() => handleStatusChange("done")} size="sm">
              <CheckCircle2 className="size-4" />
              Mark done
            </Button>
          ) : null}
          <Select
            onValueChange={(v) => handleStatusChange(v as IssueStatus)}
            value={localIssue.status}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline">{localIssue.priority}</Badge>
          {localIssue.githubIssueNumber ? (
            <Badge variant="secondary">GH #{localIssue.githubIssueNumber}</Badge>
          ) : null}
        </div>
        <MarkdownContent>
          {stripGnosisSyncFooter(localIssue.body)}
        </MarkdownContent>
        <div className="space-y-3 border-t pt-4">
          <h3 className="flex items-center gap-2 font-medium text-sm">
            <MessageSquare className="size-4" />
            Comments ({localIssue.comments.length})
          </h3>
          {localIssue.comments.map((c) => (
            <div className="group rounded-md border bg-muted/30 p-3" key={c.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-xs">{c.userName}</p>
                <Button
                  className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleRemoveComment(c.id)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="mt-1">
                <MarkdownContent>{c.body}</MarkdownContent>
              </div>
            </div>
          ))}
          <Textarea
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment (markdown supported)..."
            value={comment}
          />
          <Button disabled={!comment.trim()} onClick={handleComment} size="sm">
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}

export function IssuesPanel({
  projectPlanId,
  issues,
  phases,
  milestones,
  layout = "list",
}: IssuesPanelProps) {
  const { value: optimisticIssues, setValue: setOptimisticIssues } =
    useOptimisticAction(issues);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const selectedIssue = useMemo(
    () => optimisticIssues.find((issue) => issue._id === selectedIssueId) ?? null,
    [optimisticIssues, selectedIssueId],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return optimisticIssues.filter((issue) => {
      if (typeFilter !== "all" && issue.type !== typeFilter) return false;
      if (statusFilter !== "all" && issue.status !== statusFilter) return false;
      if (!query) return true;
      return (
        issue.title.toLowerCase().includes(query) ||
        issue.body.toLowerCase().includes(query) ||
        `#${issue.number}`.includes(query)
      );
    });
  }, [optimisticIssues, search, typeFilter, statusFilter]);

  const openCount = optimisticIssues.filter(
    (i) => i.status === "open" || i.status === "in_progress",
  ).length;

  const handleIssueCreated = (issue: ProjectIssueData) => {
    setOptimisticIssues([issue, ...optimisticIssues]);
  };

  const handleIssueUpdated = (updated: ProjectIssueData) => {
    setOptimisticIssues(
      optimisticIssues.map((issue) =>
        issue._id === updated._id ? updated : issue,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">Issues</h3>
          <Badge variant="secondary">{openCount} open</Badge>
          <Badge variant="outline">{optimisticIssues.length} total</Badge>
        </div>
        <CreateIssueDialog
          milestones={milestones}
          onCreated={handleIssueCreated}
          phases={phases}
          projectPlanId={projectPlanId}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-9"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search issues..."
            value={search}
          />
        </div>
        <Select onValueChange={setTypeFilter} value={typeFilter}>
          <SelectTrigger className="h-8 w-[120px]">
            <Filter className="mr-1 size-3" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ISSUE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ISSUE_TYPE_CONFIG[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className={
          layout === "table" ? "overflow-hidden rounded-lg border" : "divide-y rounded-lg border"
        }
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Bug className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No issues yet</p>
          </div>
        ) : layout === "table" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>GitHub</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((issue) => (
                <TableRow
                  className="cursor-pointer"
                  key={issue._id}
                  onClick={() => setSelectedIssueId(issue._id)}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      {issue.number > 0 ? (
                        <span className="shrink-0 font-mono text-muted-foreground text-xs">
                          #{issue.number}
                        </span>
                      ) : null}
                      <span className="truncate font-medium text-sm">
                        {issue.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-sm">
                    {issue.status.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    <IssueTypeBadge type={issue.type} />
                  </TableCell>
                  <TableCell className="text-sm">{issue.priority}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {issue.githubIssueNumber ? `#${issue.githubIssueNumber}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          filtered.map((issue) => (
            <button
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              key={issue._id}
              onClick={() => setSelectedIssueId(issue._id)}
              type="button"
            >
              <IssueTypeBadge type={issue.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {issue.number > 0 ? (
                    <span className="font-mono text-muted-foreground text-xs">
                      #{issue.number}
                    </span>
                  ) : null}
                  <span className="truncate font-medium text-sm">
                    {issue.title}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                  <span className="capitalize">
                    {issue.status.replace("_", " ")}
                  </span>
                  {issue.comments.length > 0 ? (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {issue.comments.length}
                    </span>
                  ) : null}
                  {issue.githubIssueNumber ? (
                    <span>GitHub #{issue.githubIssueNumber}</span>
                  ) : null}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedIssue ? (
        <IssueDetail
          issue={selectedIssue}
          onClose={() => setSelectedIssueId(null)}
          onUpdate={handleIssueUpdated}
          projectPlanId={projectPlanId}
        />
      ) : null}
    </div>
  );
}
