"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { DefaultChatTransport, type ToolUIPart, type UIMessage } from "ai";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Separator } from "@/modules/shared/components/ui/separator";
import { Spinner } from "@/modules/shared/components/ui/spinner";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

const TOOL_TITLES: Record<string, string> = {
  "tool-update_project_plan": "Update project plan",
  "tool-get_github_status": "GitHub status",
  "tool-link_github_repository": "Link GitHub repository",
  "tool-sync_to_github": "Sync to GitHub",
  "tool-sync_task_to_github": "Sync task to GitHub",
  "tool-list_github_issues": "List GitHub issues",
};

function buildWelcomeContent(plan: ProjectPlan): string {
  return `I can help you improve your project plan, apply changes directly, and work with GitHub.

**Plan**
- ${plan.phases.length} phases · ${plan.phases.reduce((acc, phase) => acc + phase.tasks.length, 0)} tasks
- ${plan.estimatedDuration} · ${plan.riskLevel} risk

**GitHub**
- Link an existing repository and pull issues and milestones into Gnosis
- Example: "Link my-repo and sync the latest issues from GitHub"

Ask me to edit the plan, reorganize phases, or manage GitHub sync.`;
}

function getToolTitle(type: string): string {
  return TOOL_TITLES[type] ?? "Tool";
}

function isToolPart(part: UIMessage["parts"][number]): part is ToolUIPart {
  return part.type.startsWith("tool-");
}

function MessageParts({
  message,
  isLastMessage,
  isStreaming,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}) {
  const reasoningParts = message.parts.filter((part) => part.type === "reasoning");
  const reasoningText = reasoningParts.map((part) => part.text).join("\n\n");
  const hasReasoning = reasoningParts.length > 0;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning";

  return (
    <>
      {hasReasoning ? (
        <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      ) : null}
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <MessageResponse key={`${message.id}-${index}`}>
              {part.text}
            </MessageResponse>
          );
        }

        if (isToolPart(part)) {
          return (
            <Tool
              defaultOpen={part.state === "output-available"}
              key={`${message.id}-${index}`}
            >
              <ToolHeader
                state={part.state}
                title={getToolTitle(part.type)}
                type={part.type}
              />
              <ToolContent>
                <ToolInput input={part.input} />
                <ToolOutput errorText={part.errorText} output={part.output} />
              </ToolContent>
            </Tool>
          );
        }

        return null;
      })}
    </>
  );
}

export interface ImprovePlanChatProps {
  projectPlanId: string;
  currentPlan: ProjectPlan;
  onPlanUpdated?: () => void;
  compact?: boolean;
}

export function ImprovePlanChat({
  projectPlanId,
  currentPlan,
  onPlanUpdated,
  compact = false,
}: ImprovePlanChatProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/improve-plan",
      body: { projectPlanId },
    }),
    onError: (error) => {
      toast.error(error.message || "Failed to get improvements");
    },
    onFinish: ({ message }) => {
      const planUpdated = message.parts.some(
        (part) =>
          part.type === "tool-update_project_plan" &&
          part.state === "output-available",
      );
      const githubUpdated = message.parts.some(
        (part) =>
          (part.type === "tool-link_github_repository" ||
            part.type === "tool-sync_to_github" ||
            part.type === "tool-sync_task_to_github") &&
          part.state === "output-available",
      );

      if (planUpdated) {
        toast.success("Project plan updated!");
        onPlanUpdated?.();
      } else if (githubUpdated) {
        toast.success("GitHub updated!");
        onPlanUpdated?.();
      }
    },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim();
    if (!text) {
      return;
    }
    sendMessage({ text });
    setInput("");
  };

  const isStreaming = status === "streaming";

  return (
    <>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent
          className={compact ? "gap-3 px-4 py-3" : "gap-4 px-6 py-4"}
        >
          <Message from="assistant">
            <MessageContent>
              <MessageResponse>{buildWelcomeContent(currentPlan)}</MessageResponse>
            </MessageContent>
          </Message>
          {messages.map((message, index) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                <MessageParts
                  isLastMessage={index === messages.length - 1}
                  isStreaming={isStreaming}
                  message={message}
                />
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" ? <Spinner /> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <Separator />

      <div className={compact ? "shrink-0 p-3" : "shrink-0 p-4"}>
        <PromptInput className="w-full" onSubmit={handleSubmit}>
          <PromptInputTextarea
            className={compact ? "min-h-[56px] pr-12" : "min-h-[72px] pr-12"}
            disabled={status === "submitted" || status === "streaming"}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder="Ask for plan changes or pull updates from GitHub..."
            value={input}
          />
          <PromptInputSubmit
            className="absolute right-2 bottom-2"
            disabled={!input.trim() || status === "submitted" || status === "streaming"}
            status={status}
          />
        </PromptInput>
      </div>
    </>
  );
}
