import { nanoid } from "nanoid";
import { z } from "zod";
import type { ProjectPlan, ProjectTask } from "@/modules/validation/types/validation.types";

const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
]);

const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const projectTaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  status: taskStatusSchema.optional(),
  priority: prioritySchema.optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  phaseId: z.string().optional(),
});

export const projectPhaseSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  duration: z.string(),
  dependencies: z.array(z.string()).optional(),
  tasks: z.array(projectTaskSchema),
});

export const projectPlanUpdateSchema = z.object({
  phases: z.array(projectPhaseSchema).min(1),
  estimatedDuration: z.string(),
  estimatedCost: z.string(),
  riskLevel: riskLevelSchema,
  priority: prioritySchema.optional(),
  summary: z
    .string()
    .describe("Brief summary of what changed in the plan"),
});

export type ProjectPlanUpdateInput = z.infer<typeof projectPlanUpdateSchema>;

function indexTasks(plan: ProjectPlan): Map<string, ProjectTask> {
  const tasks = new Map<string, ProjectTask>();
  for (const phase of plan.phases) {
    for (const task of phase.tasks) {
      tasks.set(task.id, task);
    }
  }
  return tasks;
}

export function normalizeProjectPlan(
  input: ProjectPlanUpdateInput,
  existingPlan?: ProjectPlan,
): ProjectPlan {
  const existingTasks = existingPlan ? indexTasks(existingPlan) : new Map();

  const phases = input.phases.map((phase) => {
    const phaseId = phase.id || nanoid();
    return {
      id: phaseId,
      name: phase.name,
      description: phase.description,
      duration: phase.duration,
      dependencies: phase.dependencies ?? [],
      tasks: phase.tasks.map((task) => {
        const taskId = task.id || nanoid();
        const existingTask = task.id ? existingTasks.get(task.id) : undefined;
        return {
          id: taskId,
          title: task.title,
          description: task.description,
          status: existingTask?.status ?? task.status ?? "TODO",
          priority: task.priority ?? existingTask?.priority ?? "MEDIUM",
          assignee: existingTask?.assignee ?? task.assignee,
          dueDate: existingTask?.dueDate ?? task.dueDate,
          tags: task.tags ?? existingTask?.tags ?? [],
          phaseId,
        };
      }),
    };
  });

  return {
    phases,
    estimatedDuration: input.estimatedDuration,
    estimatedCost: input.estimatedCost,
    riskLevel: input.riskLevel,
    priority: input.priority ?? existingPlan?.priority ?? "MEDIUM",
  };
}
