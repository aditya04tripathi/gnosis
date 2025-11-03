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
import { useState } from "react";
import { toast } from "sonner";
import { updateTaskStatus } from "@/actions/validation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectPlan } from "@/types";

interface ProjectBoardsProps {
  projectPlanId: string;
  plan: ProjectPlan;
}

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
    priority: "HIGH" | "MEDIUM" | "LOW";
    tags: string[];
    phaseName: string;
  };
  isDragging?: boolean;
}

function TaskItem({ task, isDragging }: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing p-3 touch-none"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm flex-1">{task.title}</h4>
          <Badge
            variant={
              task.priority === "HIGH"
                ? "destructive"
                : task.priority === "MEDIUM"
                  ? "default"
                  : "secondary"
            }
            className="text-xs ml-2"
          >
            {task.priority}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Phase: {task.phaseName}</p>
      </div>
    </Card>
  );
}

interface DroppableColumnProps {
  id: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
    priority: "HIGH" | "MEDIUM" | "LOW";
    tags: string[];
    phaseName: string;
  }>;
  activeId: string | null;
}

function DroppableColumn({
  id,
  status,
  tasks,
  activeId,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      columnStatus: status,
    },
  });

  return (
    <Card
      ref={setNodeRef}
      data-column-status={status}
      className={`flex flex-col min-h-[400px] h-full transition-colors ${
        isOver ? "border-primary border-2 bg-primary/5" : ""
      }`}
    >
      <CardHeader className="shrink-0">
        <CardTitle className="font-bold">
          {status.replace("_", " ")} ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 px-6">
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isDragging={activeId === task.id}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Drop tasks here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectBoards({ projectPlanId, plan }: ProjectBoardsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleStatusChange = async (
    taskId: string,
    newStatus: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
  ) => {
    // Only update if status actually changed
    const allTasks = plan.phases.flatMap((p) => p.tasks);
    const currentTask = allTasks.find((t) => t.id === taskId);
    if (currentTask && currentTask.status === newStatus) {
      return; // No change needed
    }

    try {
      const result = await updateTaskStatus(projectPlanId, taskId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Task status updated");
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast.error("Failed to update task status");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const task = plan.phases
      .flatMap((p) => p.tasks)
      .find((t) => t.id === event.active.id);
    if (task) {
      setDraggingTask({ id: task.id, title: task.title });
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // This handler helps with collision detection feedback
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset dragging state first
    setActiveId(null);
    setDraggingTask(null);

    // If not dropped on anything, do nothing
    if (!over) {
      return;
    }

    // If dropped on itself, do nothing
    if (active.id === over.id) {
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a status column (droppable id) first
    if (
      overId === "scrum-TODO" ||
      overId === "scrum-IN_PROGRESS" ||
      overId === "scrum-DONE"
    ) {
      const newStatus = overId.replace("scrum-", "") as
        | "TODO"
        | "IN_PROGRESS"
        | "DONE";

      // Only update if status is different
      const allTasks = plan.phases.flatMap((p) => p.tasks);
      const currentTask = allTasks.find((t) => t.id === taskId);
      if (currentTask && currentTask.status === newStatus) {
        return; // Already in this status
      }

      await handleStatusChange(taskId, newStatus);
      return;
    }

    // Check if dropped on another task (get its status)
    const allTasks = plan.phases.flatMap((p) => p.tasks);
    const targetTask = allTasks.find((t) => t.id === overId);
    if (targetTask && targetTask.id !== taskId) {
      // Only update if status is different
      const currentTask = allTasks.find((t) => t.id === taskId);
      if (currentTask && currentTask.status === targetTask.status) {
        return; // Already in this status
      }

      await handleStatusChange(taskId, targetTask.status);
      return;
    }

    // If dropped on empty space within a column, check parent element
    // This handles cases where the drop happens in empty areas
    if (over.data.current) {
      const columnStatus = over.data.current.columnStatus as
        | "TODO"
        | "IN_PROGRESS"
        | "DONE"
        | undefined;
      if (columnStatus) {
        const allTasks = plan.phases.flatMap((p) => p.tasks);
        const currentTask = allTasks.find((t) => t.id === taskId);
        if (currentTask && currentTask.status !== columnStatus) {
          await handleStatusChange(taskId, columnStatus);
          return;
        }
      }
    }
  };

  const allTasks = plan.phases.flatMap((phase) =>
    phase.tasks.map((task) => ({
      ...task,
      phaseName: phase.name,
      phaseId: phase.id,
    })),
  );

  const tasksByStatus = {
    TODO: allTasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: allTasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: allTasks.filter((t) => t.status === "DONE"),
    BLOCKED: allTasks.filter((t) => t.status === "BLOCKED"),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="grid gap-6 md:grid-cols-3 h-full">
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((status) => {
            const tasks = tasksByStatus[status];
            return (
              <DroppableColumn
                key={status}
                id={`scrum-${status}`}
                status={status}
                tasks={tasks}
                activeId={activeId}
              />
            );
          })}
        </div>
        <DragOverlay>
          {draggingTask ? (
            <Card className="p-3 opacity-90 shadow-lg rotate-2">
              <div className="font-medium text-sm">{draggingTask.title}</div>
            </Card>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
