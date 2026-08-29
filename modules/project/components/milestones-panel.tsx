"use client";

import { Flag, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { nanoid } from "nanoid";
import {
  createMilestone,
  updateMilestoneStatus,
} from "@/modules/project/actions/milestones";
import type { MilestoneData } from "@/modules/project/types/project.types";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import { Label } from "@/modules/shared/components/ui/label";
import { Textarea } from "@/modules/shared/components/ui/textarea";
import { useOptimisticAction } from "@/modules/shared/hooks/use-optimistic-action";

interface MilestonesPanelProps {
  projectPlanId: string;
  milestones: MilestoneData[];
  phases: { id: string; name: string }[];
}

export function MilestonesPanel({
  projectPlanId,
  milestones,
}: MilestonesPanelProps) {
  const router = useRouter();
  const { value: optimisticMilestones, setValue: setOptimisticMilestones, run } =
    useOptimisticAction(milestones);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;

    const tempMilestone: MilestoneData = {
      id: `temp-${nanoid()}`,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || undefined,
      status: "open",
    };

    setOptimisticMilestones([...optimisticMilestones, tempMilestone]);
    setShowForm(false);
    setTitle("");
    setDescription("");
    setDueDate("");

    void createMilestone(projectPlanId, {
      title: tempMilestone.title,
      description: tempMilestone.description,
      dueDate: tempMilestone.dueDate,
    }).then((result) => {
      if (result.error) {
        setOptimisticMilestones(milestones);
        return;
      }
      router.refresh();
    });
  };

  const toggleStatus = (id: string, current: "open" | "closed") => {
    const next = current === "open" ? "closed" : "open";
    void run(
      (items) =>
        items.map((milestone) =>
          milestone.id === id ? { ...milestone, status: next } : milestone,
        ),
      () => updateMilestoneStatus(projectPlanId, id, next),
    ).then((result) => {
      if (!result.error) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Milestones</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm" variant="outline">
          <Plus className="size-4" />
          New milestone
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input onChange={(e) => setTitle(e.target.value)} value={title} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />
          </div>
          <div className="space-y-2">
            <Label>Due date</Label>
            <Input
              onChange={(e) => setDueDate(e.target.value)}
              type="date"
              value={dueDate}
            />
          </div>
          <Button disabled={!title.trim()} onClick={handleCreate} size="sm">
            Create
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        {optimisticMilestones.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No milestones yet. Tie validation phases to delivery goals.
          </p>
        ) : (
          optimisticMilestones.map((milestone) => (
            <div
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              key={milestone.id}
            >
              <div className="flex items-center gap-3">
                <Flag className="size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{milestone.title}</p>
                  {milestone.dueDate ? (
                    <p className="text-muted-foreground text-xs">
                      Due {new Date(milestone.dueDate).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={milestone.status === "open" ? "default" : "secondary"}
                >
                  {milestone.status}
                </Badge>
                <Button
                  onClick={() => toggleStatus(milestone.id, milestone.status)}
                  size="sm"
                  variant="ghost"
                >
                  {milestone.status === "open" ? "Mark complete" : "Reopen"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
