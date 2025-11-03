"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { generatePlan } from "@/actions/validation";
import { Button } from "@/components/ui/button";

interface GeneratePlanButtonProps {
  validationId: string;
}

export function GeneratePlanButton({ validationId }: GeneratePlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generatePlan(validationId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.projectPlanId) {
        toast.success("Project plan generated!");
        router.push(`/project/${result.projectPlanId}`);
      }
    } catch {
      toast.error("Failed to generate project plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} size="lg" disabled={loading}>
      <Sparkles className="mr-2 h-4 w-4" />
      {loading ? "Generating..." : "Generate Project Plan"}
    </Button>
  );
}
