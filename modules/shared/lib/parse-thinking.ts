const THINKING_TAG_REGEX =
  /<\s*(?:think|redacted_thinking)\s*>([\s\S]*?)<\/\s*(?:think|redacted_thinking)\s*>/gi;

export function parseThinkingContent(raw: string): {
  content: string;
  reasoning: string | null;
} {
  const reasoningParts: string[] = [];
  let content = raw;

  for (const match of content.matchAll(THINKING_TAG_REGEX)) {
    if (match[1]?.trim()) {
      reasoningParts.push(match[1].trim());
    }
  }

  content = content.replace(THINKING_TAG_REGEX, "").trim();

  return {
    content,
    reasoning: reasoningParts.length > 0 ? reasoningParts.join("\n\n") : null,
  };
}

export function extractAssistantReply(
  content: string | null | undefined,
  reasoningField?: string | null,
): { content: string; reasoning: string | null } {
  const parsed = parseThinkingContent(content ?? "");
  return {
    content: parsed.content || content || "No response.",
    reasoning: reasoningField?.trim() || parsed.reasoning,
  };
}
