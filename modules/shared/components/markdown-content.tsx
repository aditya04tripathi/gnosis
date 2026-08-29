"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { Streamdown } from "streamdown";
import { cn } from "@/modules/shared/lib/utils";

const streamdownPlugins = { cjk, code, math, mermaid };

interface MarkdownContentProps {
  children: string;
  className?: string;
}

export function MarkdownContent({ children, className }: MarkdownContentProps) {
  if (!children.trim()) {
    return <p className="text-muted-foreground text-sm">No description.</p>;
  }

  return (
    <Streamdown
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      plugins={streamdownPlugins}
    >
      {children}
    </Streamdown>
  );
}
