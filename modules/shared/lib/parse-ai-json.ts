export function parseModelJson<T>(text: string): T {
  const candidates = collectJsonCandidates(text);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {}

    const withoutTrailingCommas = candidate.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(withoutTrailingCommas) as T;
    } catch {}
  }

  throw new Error("Failed to parse model JSON response");
}

function collectJsonCandidates(text: string): string[] {
  const trimmed = text.trim();
  const candidates = [trimmed];

  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlock?.[1]) {
    candidates.push(codeBlock[1].trim());
  }

  const object = extractBalancedJson(trimmed, "{", "}");
  if (object) {
    candidates.push(object);
  }

  const array = extractBalancedJson(trimmed, "[", "]");
  if (array) {
    candidates.push(array);
  }

  return [...new Set(candidates)];
}

function extractBalancedJson(
  text: string,
  open: "{" | "[",
  close: "}" | "]",
): string | null {
  const start = text.indexOf(open);
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === open) {
      depth += 1;
      continue;
    }

    if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}
