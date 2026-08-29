"use client";

import { ChevronDown, Minus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ImprovePlanChat } from "@/modules/validation/components/improve-plan-chat";
import { Button } from "@/modules/shared/components/ui/button";
import { cn } from "@/modules/shared/lib/utils";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

type ProjectAiChatContextValue = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
  isMinimized: boolean;
};

const ProjectAiChatContext = createContext<ProjectAiChatContextValue | null>(
  null,
);

export function useProjectAiChat() {
  const context = useContext(ProjectAiChatContext);
  if (!context) {
    throw new Error("useProjectAiChat must be used within ProjectAiChatProvider");
  }
  return context;
}

export function useOptionalProjectAiChat() {
  return useContext(ProjectAiChatContext);
}

interface ProjectAiChatProviderProps {
  projectPlanId: string;
  plan: ProjectPlan;
  children: React.ReactNode;
}

export function ProjectAiChatProvider({
  projectPlanId,
  plan,
  children,
}: ProjectAiChatProviderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasActivated, setHasActivated] = useState(false);
  const chatKeyRef = useRef(projectPlanId);

  const open = useCallback(() => {
    setHasActivated(true);
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
      return;
    }
    setHasActivated(true);
    setIsOpen(true);
    setIsMinimized(false);
  }, [isOpen, isMinimized]);

  const handlePlanUpdated = useCallback(() => {
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      open,
      close,
      toggle,
      isOpen,
      isMinimized,
    }),
    [close, isMinimized, isOpen, open, toggle],
  );

  if (chatKeyRef.current !== projectPlanId) {
    chatKeyRef.current = projectPlanId;
    setHasActivated(false);
    setIsOpen(false);
    setIsMinimized(false);
  }

  return (
    <ProjectAiChatContext.Provider value={value}>
      {children}

      {!isOpen ? (
        <button
          aria-label="Open AI assistant"
          className="fixed right-6 bottom-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          onClick={open}
          type="button"
        >
          <Sparkles className="size-6" />
        </button>
      ) : null}

      <div
        className={cn(
          "fixed right-6 bottom-6 z-50 flex flex-col overflow-hidden rounded-xl border bg-background shadow-2xl transition-all duration-300",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
          isMinimized
            ? "h-14 w-[min(380px,calc(100vw-3rem))]"
            : "h-[min(640px,70vh)] w-[min(420px,calc(100vw-3rem))]",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
          <button
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
              }
            }}
            type="button"
          >
            <Sparkles className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">Gnosis AI</p>
              {isMinimized ? (
                <p className="truncate text-muted-foreground text-xs">
                  Chat saved — click to expand
                </p>
              ) : null}
            </div>
          </button>
          <div className="flex items-center gap-1">
            <Button
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              onClick={() => setIsMinimized((value) => !value)}
              size="icon"
              variant="ghost"
            >
              {isMinimized ? (
                <ChevronDown className="size-4" />
              ) : (
                <Minus className="size-4" />
              )}
            </Button>
            <Button aria-label="Close chat" onClick={close} size="icon" variant="ghost">
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {hasActivated ? (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              isMinimized && "hidden",
            )}
          >
            <ImprovePlanChat
              compact
              currentPlan={plan}
              key={projectPlanId}
              onPlanUpdated={handlePlanUpdated}
              projectPlanId={projectPlanId}
            />
          </div>
        ) : null}
      </div>
    </ProjectAiChatContext.Provider>
  );
}
