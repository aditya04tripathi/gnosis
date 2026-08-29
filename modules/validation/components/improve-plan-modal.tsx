"use client";

import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/modules/shared/components/ui/dialog";
import { Separator } from "@/modules/shared/components/ui/separator";
import { ImprovePlanChat } from "@/modules/validation/components/improve-plan-chat";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

interface ImprovePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectPlanId: string;
  currentPlan: ProjectPlan;
  onPlanUpdated?: () => void;
}

export function ImprovePlanModal({
  open,
  onOpenChange,
  projectPlanId,
  currentPlan,
  onPlanUpdated,
}: ImprovePlanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Improve Project Plan
          </DialogTitle>
          <DialogDescription>
            Chat with AI to refine and update your project plan (uses 0.5
            validation credits)
          </DialogDescription>
        </DialogHeader>

        <Separator className="mt-4" />

        {open ? (
          <ImprovePlanChat
            currentPlan={currentPlan}
            key={projectPlanId}
            onPlanUpdated={onPlanUpdated}
            projectPlanId={projectPlanId}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
