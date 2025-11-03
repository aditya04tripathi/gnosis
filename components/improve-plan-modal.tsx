"use client";

import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { improveProjectPlan } from "@/actions/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectPlan } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `I can help you improve your project plan. Here's what I see:

- ${currentPlan.phases.length} phases planned
- ${currentPlan.phases.reduce((acc, p) => acc + p.tasks.length, 0)} total tasks
- Estimated duration: ${currentPlan.estimatedDuration}
- Risk level: ${currentPlan.riskLevel}

What would you like to improve? You can ask me to:
- Add more detailed tasks
- Adjust timelines
- Optimize the workflow
- Add missing steps
- Or anything else about your plan!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 100);
      }
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await improveProjectPlan(projectPlanId, input);

      if (result.error) {
        toast.error(result.error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I encountered an error: ${result.error}`,
          },
        ]);
      } else if (result.improvements) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.improvements,
          },
        ]);

        if (result.updatedPlan) {
          toast.success("Plan updated! Refresh to see changes.");
          onPlanUpdated?.();
        }
      }
    } catch {
      toast.error("Failed to get improvements");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Improve Project Plan
          </DialogTitle>
          <DialogDescription>
            Chat with AI to refine and improve your project plan (uses 0.5
            validation credits)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap wrap-break-word">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask for improvements..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="self-end shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
