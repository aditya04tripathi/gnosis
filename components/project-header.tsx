"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProjectPlan } from "@/types";
import { ImprovePlanModal } from "./improve-plan-modal";

interface ProjectHeaderProps {
  projectPlanId: string;
  plan: ProjectPlan;
  onPlanUpdated?: () => void;
}

export function ProjectHeader({
  projectPlanId,
  plan,
  onPlanUpdated,
}: ProjectHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handlePlanUpdated = () => {
    onPlanUpdated?.();
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Plan</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Improve Plan
        </Button>
      </div>
      <ImprovePlanModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectPlanId={projectPlanId}
        currentPlan={plan}
        onPlanUpdated={handlePlanUpdated}
      />
    </>
  );
}
