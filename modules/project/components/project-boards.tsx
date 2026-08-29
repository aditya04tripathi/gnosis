"use client";

import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckCircle2,
  CircleDot,
  GripVertical,
  Kanban,
  LayoutList,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import { Progress } from "@/modules/shared/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shared/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/modules/shared/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/shared/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/modules/shared/components/ui/toggle-group";
import { stripGnosisSyncFooter } from "@/modules/github/lib/gnosis-attribution";
import { MarkdownContent } from "@/modules/shared/components/markdown-content";
import { cn } from "@/modules/shared/lib/utils";
import { updateTaskStatus } from "@/modules/validation/actions/validation";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

interface ProjectBoardsProps {
  projectPlanId: string;
  plan: ProjectPlan;
  embedded?: boolean;
}

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
type TaskPriority = "HIGH" | "MEDIUM" | "LOW";
type BoardView = "board" | "list";

type BoardTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  phaseName: string;
  phaseId: string;
  order: number;
};

type SortOption =
  | "default"
  | "title-asc"
  | "title-desc"
  | "priority-high"
  | "priority-low"
  | "phase-asc";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const BOARD_COLUMNS: {
  id: TaskStatus;
  label: string;
  dotClass: string;
  hint: string;
}[] = [
  {
    id: "TODO",
    label: "Todo",
    dotClass: "bg-emerald-500",
    hint: "This item hasn't been started",
  },
  {
    id: "IN_PROGRESS",
    label: "In progress",
    dotClass: "bg-amber-400",
    hint: "This is actively being worked on",
  },
  {
    id: "DONE",
    label: "Done",
    dotClass: "bg-violet-500",
    hint: "This has been completed",
  },
  {
    id: "BLOCKED",
    label: "Blocked",
    dotClass: "bg-rose-500",
    hint: "This item is blocked",
  },
];

const TAG_COLORS = [
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
];

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

function shortId(id: string): string {
  return id.slice(-6).toUpperCase();
}

function sortTasks(tasks: BoardTask[], sort: SortOption): BoardTask[] {
  const sorted = [...tasks];

  switch (sort) {
    case "title-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "priority-high":
      return sorted.sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
      );
    case "priority-low":
      return sorted.sort(
        (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority],
      );
    case "phase-asc":
      return sorted.sort((a, b) => a.phaseName.localeCompare(b.phaseName));
    default:
      return sorted.sort((a, b) => a.order - b.order);
  }
}

function filterTasks(
  tasks: BoardTask[],
  search: string,
  phaseFilter: string,
  priorityFilter: string,
  tagFilter: string,
): BoardTask[] {
  const query = search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (phaseFilter !== "all" && task.phaseId !== phaseFilter) {
      return false;
    }
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }
    if (tagFilter !== "all" && !task.tags.includes(tagFilter)) {
      return false;
    }
    if (!query) {
      return true;
    }
    return (
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.phaseName.toLowerCase().includes(query) ||
      task.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      shortId(task.id).toLowerCase().includes(query)
    );
  });
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide",
        priority === "HIGH" && "bg-rose-500/15 text-rose-600 dark:text-rose-300",
        priority === "MEDIUM" &&
          "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        priority === "LOW" && "bg-slate-500/15 text-slate-600 dark:text-slate-300",
      )}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const column = BOARD_COLUMNS.find((item) => item.id === status);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn("size-2 rounded-full", column?.dotClass)} />
      {column?.label ?? status}
    </span>
  );
}

interface TaskItemProps {
  task: BoardTask;
  isDragging?: boolean;
  onSelect: (task: BoardTask) => void;
}

function TaskItem({ task, isDragging, onSelect }: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.45 : 1,
  };

  const priorityBorder =
    task.priority === "HIGH"
      ? "border-l-rose-500"
      : task.priority === "MEDIUM"
        ? "border-l-amber-500"
        : "border-l-muted-foreground/40";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-md border border-l-[3px] bg-card shadow-xs transition-colors hover:bg-muted/20",
        priorityBorder,
        (isDragging || isSortableDragging) && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-1 p-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag task"
        >
          <GripVertical className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onSelect(task)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="line-clamp-2 font-medium text-sm leading-snug">
            {task.title}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="truncate">{task.phaseName}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0 font-mono">#{shortId(task.id)}</span>
          </div>
        </button>
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  status: TaskStatus;
  label: string;
  dotClass: string;
  hint: string;
  tasks: BoardTask[];
  activeId: string | null;
  onSelectTask: (task: BoardTask) => void;
}

function DroppableColumn({
  id,
  status,
  label,
  dotClass,
  hint,
  tasks,
  activeId,
  onSelectTask,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { columnStatus: status },
  });

  return (
    <div
      ref={setNodeRef}
      data-column-status={status}
      className={cn(
        "flex min-w-[260px] flex-1 flex-col rounded-lg border bg-muted/20",
        isOver && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn("size-2.5 rounded-full", dotClass)} />
        <span className="font-semibold text-sm">{label}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
          {tasks.length}
        </span>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-2">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskItem
              isDragging={activeId === task.id}
              key={task.id}
              onSelect={onSelectTask}
              task={task}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed px-3 py-8">
            <p className="text-center text-muted-foreground text-xs">{hint}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface TaskDetailSheetProps {
  task: BoardTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onStatusChange,
}: TaskDetailSheetProps) {
  const [showAllLabels, setShowAllLabels] = useState(false);

  if (!task) {
    return null;
  }

  const visibleTags = showAllLabels ? task.tags : task.tags.slice(0, 8);
  const hiddenTagCount = task.tags.length - visibleTags.length;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="gap-3 border-b px-6 py-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span className="font-mono">#{shortId(task.id)}</span>
            <span>·</span>
            <StatusBadge status={task.status} />
          </div>
          <SheetTitle className="text-left text-lg leading-snug">
            {task.title}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Description
            </p>
            <div className="rounded-lg border bg-muted/30 px-3 py-3 text-foreground/90 text-sm leading-relaxed">
              <MarkdownContent>
                {stripGnosisSyncFooter(task.description || "")}
              </MarkdownContent>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Status
              </p>
              <Select
                onValueChange={(value) =>
                  onStatusChange(task.id, value as TaskStatus)
                }
                value={task.status}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_COLUMNS.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Priority
              </p>
              <PriorityBadge priority={task.priority} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Phase
              </p>
              <p className="text-sm">{task.phaseName}</p>
            </div>
          </div>

          {task.tags.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Labels
                </p>
                <span className="text-muted-foreground text-xs">
                  {task.tags.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "max-w-full truncate rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[11px] text-foreground/80",
                      tagColor(tag),
                    )}
                    title={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {hiddenTagCount > 0 ? (
                <Button
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowAllLabels(true)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Show {hiddenTagCount} more
                </Button>
              ) : null}
              {showAllLabels && task.tags.length > 8 ? (
                <Button
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowAllLabels(false)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Show less
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {task.status !== "DONE" ? (
          <div className="border-t px-6 py-4">
            <Button
              className="w-full"
              onClick={() => onStatusChange(task.id, "DONE")}
              type="button"
            >
              <CheckCircle2 className="size-4" />
              Mark complete
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function ProjectBoards({
  projectPlanId,
  plan,
  embedded = false,
}: ProjectBoardsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState<BoardTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [view, setView] = useState<BoardView>("board");
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("default");
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, TaskStatus>
  >({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const allTasks = useMemo(
    () =>
      plan.phases.flatMap((phase, phaseIndex) =>
        phase.tasks.map((task, taskIndex) => ({
          ...task,
          status: statusOverrides[task.id] ?? task.status,
          phaseName: phase.name,
          phaseId: phase.id,
          order: phaseIndex * 10_000 + taskIndex,
        })),
      ),
    [plan.phases, statusOverrides],
  );

  const availableTags = useMemo(
    () =>
      [...new Set(allTasks.flatMap((task) => task.tags))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [allTasks],
  );

  const filteredTasks = useMemo(() => {
    const filtered = filterTasks(
      allTasks,
      search,
      phaseFilter,
      priorityFilter,
      tagFilter,
    );
    return sortTasks(filtered, sort);
  }, [allTasks, search, phaseFilter, priorityFilter, tagFilter, sort]);

  const tasksByStatus = useMemo(
    () =>
      Object.fromEntries(
        BOARD_COLUMNS.map((column) => [
          column.id,
          filteredTasks.filter((task) => task.status === column.id),
        ]),
      ) as Record<TaskStatus, BoardTask[]>,
    [filteredTasks],
  );

  const doneCount = allTasks.filter((task) => task.status === "DONE").length;
  const progress =
    allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;

  const hasActiveFilters =
    search.trim().length > 0 ||
    phaseFilter !== "all" ||
    priorityFilter !== "all" ||
    tagFilter !== "all" ||
    sort !== "default";

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const currentTask = allTasks.find((task) => task.id === taskId);
    if (!currentTask || currentTask.status === newStatus) {
      return;
    }

    const previousStatus =
      statusOverrides[taskId] ??
      plan.phases
        .flatMap((phase) => phase.tasks)
        .find((task) => task.id === taskId)?.status ??
      currentTask.status;

    setStatusOverrides((prev) => ({ ...prev, [taskId]: newStatus }));
    setSelectedTask((prev) =>
      prev?.id === taskId ? { ...prev, status: newStatus } : prev,
    );
    setDraggingTask((prev) =>
      prev?.id === taskId ? { ...prev, status: newStatus } : prev,
    );

    void updateTaskStatus(projectPlanId, taskId, newStatus).then((result) => {
      if (result.error) {
        setStatusOverrides((prev) => {
          const next = { ...prev };
          if (previousStatus === newStatus) {
            delete next[taskId];
          } else {
            next[taskId] = previousStatus;
          }
          return next;
        });
        setSelectedTask((prev) =>
          prev?.id === taskId ? { ...prev, status: previousStatus } : prev,
        );
        toast.error(result.error);
      }
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find((item) => item.id === event.active.id);
    setActiveId(event.active.id as string);
    setDraggingTask(task ?? null);
  };

  const handleDragOver = (_event: DragOverEvent) => {};

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggingTask(null);

    if (!over || active.id === over.id) {
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;
    const columnMatch = BOARD_COLUMNS.find(
      (column) => overId === `board-${column.id}`,
    );

    if (columnMatch) {
      handleStatusChange(taskId, columnMatch.id);
      return;
    }

    const targetTask = allTasks.find((task) => task.id === overId);
    if (targetTask) {
      handleStatusChange(taskId, targetTask.status);
      return;
    }

    const columnStatus = over.data.current?.columnStatus as
      | TaskStatus
      | undefined;
    if (columnStatus) {
      handleStatusChange(taskId, columnStatus);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPhaseFilter("all");
    setPriorityFilter("all");
    setTagFilter("all");
    setSort("default");
  };

  const openTaskDetail = (task: BoardTask) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <div
        className={cn(
          embedded ? "overflow-hidden" : "overflow-hidden rounded-xl border bg-background",
        )}
      >
        <div className="flex flex-col gap-3 border-b px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {!embedded ? (
                <ToggleGroup
                  onValueChange={(value) => {
                    if (value) {
                      setView(value as BoardView);
                    }
                  }}
                  type="single"
                  value={view}
                  variant="outline"
                >
                  <ToggleGroupItem aria-label="Board view" value="board">
                    <Kanban className="size-4" />
                    Board
                  </ToggleGroupItem>
                  <ToggleGroupItem aria-label="List view" value="list">
                    <LayoutList className="size-4" />
                    List
                  </ToggleGroupItem>
                </ToggleGroup>
              ) : null}
              <span className="text-muted-foreground text-sm">
                {filteredTasks.length} items
              </span>
            </div>
            <div className="flex min-w-[180px] flex-1 items-center gap-3 sm:max-w-xs">
              <Progress className="h-2" value={progress} />
              <span className="shrink-0 text-muted-foreground text-xs">
                {progress}% done
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 bg-muted/30 pl-9"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter tasks..."
                value={search}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={setPhaseFilter} value={phaseFilter}>
                <SelectTrigger className="h-8 w-[130px] bg-muted/30">
                  <SelectValue placeholder="Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All phases</SelectItem>
                  {plan.phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={setPriorityFilter} value={priorityFilter}>
                <SelectTrigger className="h-8 w-[120px] bg-muted/30">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setTagFilter} value={tagFilter}>
                <SelectTrigger className="h-8 w-[110px] bg-muted/30">
                  <SelectValue placeholder="Label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All labels</SelectItem>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) => setSort(value as SortOption)}
                value={sort}
              >
                <SelectTrigger className="h-8 w-[150px] bg-muted/30">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="title-asc">Title A–Z</SelectItem>
                  <SelectItem value="title-desc">Title Z–A</SelectItem>
                  <SelectItem value="priority-high">Priority ↓</SelectItem>
                  <SelectItem value="priority-low">Priority ↑</SelectItem>
                  <SelectItem value="phase-asc">Phase A–Z</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters ? (
                <Button
                  className="h-8"
                  onClick={clearFilters}
                  size="sm"
                  variant="ghost"
                >
                  <X className="size-4" />
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {(embedded || view === "board") ? (
          <div className={cn("overflow-x-auto", embedded ? "" : "p-4")}>
            <div className="flex min-h-[520px] gap-3">
              {BOARD_COLUMNS.map((column) => (
                <DroppableColumn
                  activeId={activeId}
                  dotClass={column.dotClass}
                  hint={column.hint}
                  id={`board-${column.id}`}
                  key={column.id}
                  label={column.label}
                  onSelectTask={openTaskDetail}
                  status={column.id}
                  tasks={tasksByStatus[column.id]}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Labels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="py-10 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      No tasks match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow
                      className="cursor-pointer"
                      key={task.id}
                      onClick={() => openTaskDetail(task)}
                    >
                      <TableCell className="font-mono text-muted-foreground text-xs">
                        #{shortId(task.id)}
                      </TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {task.phaseName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px]",
                                tagColor(tag),
                              )}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DragOverlay>
        {draggingTask ? (
          <div className="w-72 rounded-md border bg-card p-3 shadow-lg">
            <p className="font-medium text-sm">{draggingTask.title}</p>
            <div className="mt-2 flex items-center gap-2">
              <CircleDot className="size-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {draggingTask.phaseName}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <TaskDetailSheet
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
        open={detailOpen}
        task={selectedTask}
      />
    </DndContext>
  );
}
