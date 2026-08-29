import type { Octokit } from "@octokit/rest";
import { ensureMilestonesFromRoadmap } from "@/modules/project/lib/milestones-from-roadmap";
import { reconcileMilestoneMap } from "@/modules/github/lib/sync-reconcile";
import type { IProjectPlan } from "@/modules/shared/models/ProjectPlan";

type MilestoneMapEntry = { number: number };

export function getMilestoneMap(
  github: NonNullable<IProjectPlan["github"]>,
): Map<string, MilestoneMapEntry> {
  const raw = github.milestoneMap;

  if (raw instanceof Map) {
    return raw;
  }

  return new Map(
    Object.entries((raw ?? {}) as Record<string, MilestoneMapEntry>),
  );
}

function persistMilestoneMap(
  projectPlan: IProjectPlan,
  milestoneMap: Map<string, MilestoneMapEntry>,
) {
  if (!projectPlan.github) {
    return;
  }

  projectPlan.github = {
    ...projectPlan.github,
    milestoneMap,
  };
  projectPlan.markModified("github");
}

export function getGithubMilestoneForPhase(
  github: NonNullable<IProjectPlan["github"]>,
  phaseId: string,
): number | undefined {
  return getMilestoneMap(github).get(`phase:${phaseId}`)?.number;
}

export function getGithubMilestoneForGnosisMilestone(
  github: NonNullable<IProjectPlan["github"]>,
  milestoneId: string,
): number | undefined {
  return getMilestoneMap(github).get(`milestone:${milestoneId}`)?.number;
}

function isMilestoneAlreadyExistsError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 422
  ) {
    const message = JSON.stringify(error);
    return message.includes("already_exists");
  }
  return false;
}

async function findMilestoneByTitle(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
): Promise<number | null> {
  const response = await octokit.rest.issues.listMilestones({
    owner,
    repo,
    state: "all",
    per_page: 100,
  });

  const normalizedTitle = title.trim().toLowerCase();
  const match = response.data.find(
    (milestone) => milestone.title.trim().toLowerCase() === normalizedTitle,
  );

  return match?.number ?? null;
}

async function ensureGithubMilestone(
  octokit: Octokit,
  owner: string,
  repo: string,
  milestoneMap: Map<string, MilestoneMapEntry>,
  mapKey: string,
  title: string,
  description: string,
  state: "open" | "closed",
  dueOn?: string,
): Promise<number> {
  const existing = milestoneMap.get(mapKey);
  if (existing?.number) {
    try {
      await octokit.rest.issues.updateMilestone({
        owner,
        repo,
        milestone_number: existing.number,
        title,
        description,
        state,
        due_on: dueOn,
      });
      return existing.number;
    } catch {
      milestoneMap.delete(mapKey);
    }
  }

  const existingByTitle = await findMilestoneByTitle(
    octokit,
    owner,
    repo,
    title,
  );
  if (existingByTitle) {
    await octokit.rest.issues
      .updateMilestone({
        owner,
        repo,
        milestone_number: existingByTitle,
        title,
        description,
        state,
        due_on: dueOn,
      })
      .catch(() => undefined);

    milestoneMap.set(mapKey, { number: existingByTitle });
    return existingByTitle;
  }

  try {
    const created = await octokit.rest.issues.createMilestone({
      owner,
      repo,
      title,
      description,
      state,
      due_on: dueOn,
    });

    milestoneMap.set(mapKey, { number: created.data.number });
    return created.data.number;
  } catch (error) {
    if (!isMilestoneAlreadyExistsError(error)) {
      throw error;
    }

    const fallback = await findMilestoneByTitle(octokit, owner, repo, title);
    if (!fallback) {
      throw error;
    }

    milestoneMap.set(mapKey, { number: fallback });
    return fallback;
  }
}

export async function syncMilestonesToGitHub(
  octokit: Octokit,
  projectPlan: IProjectPlan,
): Promise<{ synced: number; created: number; updated: number }> {
  const github = projectPlan.github;
  if (!github?.owner || !github.repo) {
    throw new Error("GitHub repository not linked");
  }

  await reconcileMilestoneMap(octokit, projectPlan);

  ensureMilestonesFromRoadmap(projectPlan);

  const { owner, repo } = github;
  const milestoneMap = getMilestoneMap(github);
  let created = 0;
  let updated = 0;

  for (const milestone of projectPlan.milestones ?? []) {
    const mapKey = milestone.phaseId
      ? `phase:${milestone.phaseId}`
      : `milestone:${milestone.id}`;

    const hadMilestone = milestoneMap.has(mapKey);
    const dueOn =
      milestone.phaseId || !milestone.dueDate
        ? undefined
        : milestone.dueDate.toISOString().slice(0, 10);

    const number = await ensureGithubMilestone(
      octokit,
      owner,
      repo,
      milestoneMap,
      mapKey,
      milestone.title,
      milestone.description || milestone.title,
      milestone.status === "closed" ? "closed" : "open",
      dueOn,
    );

    if (milestone.phaseId) {
      milestoneMap.set(`phase:${milestone.phaseId}`, { number });
    } else {
      milestoneMap.set(`milestone:${milestone.id}`, { number });
    }

    if (hadMilestone) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  persistMilestoneMap(projectPlan, milestoneMap);

  return {
    synced: projectPlan.milestones?.length ?? 0,
    created,
    updated,
  };
}
