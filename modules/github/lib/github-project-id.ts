const GITHUB_PROJECT_NODE_ID_PATTERN = /^PVT_[A-Za-z0-9_-]+$/;

export function isValidGitHubProjectNodeId(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    GITHUB_PROJECT_NODE_ID_PATTERN.test(value.trim())
  );
}

export function readGitHubProjectNodeId(
  project: { id?: unknown } | null | undefined,
): string | undefined {
  if (!project || !isValidGitHubProjectNodeId(project.id)) {
    return undefined;
  }
  return project.id.trim();
}

export function toPlainGitHubProject<T extends Record<string, unknown>>(
  project: T | { toObject?: () => T },
): T {
  if (
    project &&
    typeof project === "object" &&
    "toObject" in project &&
    typeof project.toObject === "function"
  ) {
    return project.toObject();
  }
  return project as T;
}
