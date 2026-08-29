"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/modules/shared/components/ui/button";
import { useOptionalProjectAiChat } from "@/modules/project/components/project-ai-chat-provider";

interface ProjectHeaderProps {
  onPlanUpdated?: () => void;
}

export function ProjectHeader({ onPlanUpdated }: ProjectHeaderProps) {
  const aiChat = useOptionalProjectAiChat();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1>Project Plan</h1>
      </div>
      <Button
        className="gap-2"
        onClick={() => {
          aiChat?.open();
          onPlanUpdated?.();
        }}
      >
        <Sparkles className="h-4 w-4" />
        AI Assistant
      </Button>
    </div>
  );
}
