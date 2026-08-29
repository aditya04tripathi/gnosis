"use client";

import { ArrowRight, CheckCircle2, Circle, LayoutGrid, Sparkles } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    id: "validate",
    title: "Validate idea",
    description: "AI scores your startup concept, market fit, and risks",
    href: "/validate",
    icon: Sparkles,
  },
  {
    id: "plan",
    title: "Generate plan",
    description: "Get phases, tasks, and timeline from validation results",
    href: "/dashboard",
    icon: CheckCircle2,
  },
  {
    id: "manage",
    title: "Manage execution",
    description: "Issues, board, milestones, GitHub sync — ship it",
    href: "/dashboard",
    icon: LayoutGrid,
  },
];

export function ValidationHub() {
  return (
    <div className="rounded-xl border bg-muted/20 p-6">
      <h2 className="mb-1 font-semibold text-lg">Validation → Execution pipeline</h2>
      <p className="mb-6 text-muted-foreground text-sm">
        From idea to shipped product in one platform
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <Link
            className="group flex flex-col rounded-lg border bg-background p-4 transition-colors hover:border-primary/50"
            href={step.href}
            key={step.id}
          >
            <div className="mb-3 flex items-center gap-2">
              {index === 0 ? (
                <step.icon className="size-5 text-primary" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
              )}
              <span className="font-medium text-sm">
                {index + 1}. {step.title}
              </span>
            </div>
            <p className="flex-1 text-muted-foreground text-xs leading-relaxed">
              {step.description}
            </p>
            <span className="mt-3 flex items-center gap-1 text-primary text-xs opacity-0 transition-opacity group-hover:opacity-100">
              Go <ArrowRight className="size-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
