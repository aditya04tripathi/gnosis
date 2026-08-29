import { nanoid } from "nanoid";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";

function phaseMilestoneStatus(
  phase: IProjectPlan["plan"]["phases"][number],
): "open" | "closed" {
  if (phase.tasks.length === 0) {
    return "open";
  }
  return phase.tasks.every((task) => task.status === "DONE") ? "closed" : "open";
}

export function ensureMilestonesFromRoadmap(projectPlan: IProjectPlan): boolean {
  const milestones = [...(projectPlan.milestones ?? [])];
  let changed = false;

  for (const phase of projectPlan.plan.phases) {
    const existing = milestones.find((milestone) => milestone.phaseId === phase.id);

    if (existing) {
      const nextStatus = phaseMilestoneStatus(phase);
      if (
        existing.title !== phase.name ||
        existing.description !== (phase.description ?? "") ||
        existing.status !== nextStatus
      ) {
        existing.title = phase.name;
        existing.description = phase.description ?? "";
        existing.status = nextStatus;
        changed = true;
      }
      continue;
    }

    milestones.push({
      id: nanoid(),
      title: phase.name,
      description: phase.description ?? "",
      status: phaseMilestoneStatus(phase),
      phaseId: phase.id,
    });
    changed = true;
  }

  if (changed) {
    projectPlan.milestones = milestones;
    projectPlan.markModified("milestones");
  }

  return changed;
}

export function serializeMilestones(projectPlan: IProjectPlan) {
  return (projectPlan.milestones ?? []).map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    dueDate: milestone.dueDate?.toISOString(),
    status: milestone.status,
    phaseId: milestone.phaseId,
  }));
}
