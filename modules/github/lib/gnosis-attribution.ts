export const GNOSIS_BYLINE = "\n\n-by gnosis";

export function withGnosisByline(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "-by gnosis";
  }
  if (trimmed.endsWith("-by gnosis")) {
    return trimmed;
  }
  return `${trimmed}${GNOSIS_BYLINE}`;
}

export function stripGnosisByline(content: string): string {
  return content.replace(/\n?\n?-by gnosis\s*$/i, "").trim();
}

export function stripGnosisSyncFooter(content: string): string {
  const withoutFooter = content.split(/\n---\n/)[0] ?? content;
  const withoutTable = withoutFooter.split(/\n\| Field \| Value \|/)[0] ?? withoutFooter;
  return stripGnosisByline(withoutTable).trim();
}

export const GITHUB_OAUTH_SCOPES = [
  "repo",
  "read:user",
  "read:org",
  "project",
].join(" ");
