import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { requestGitHubSync } from "@/modules/github/lib/sync-queue";
import connectDB from "@/modules/shared/lib/db";
import ProjectPlan, {
  type IProjectPlan,
} from "@/modules/shared/models/ProjectPlan";

function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(payload) as {
    action?: string;
    issue?: {
      number: number;
      state: string;
      title: string;
      body: string | null;
      labels: Array<{ name: string }>;
      milestone?: { number: number; title: string } | null;
    };
    milestone?: {
      number: number;
      title: string;
      state: string;
    };
    repository?: { owner: { login: string }; name: string };
  };

  if (!body.repository) {
    return NextResponse.json({ ok: true });
  }

  const { owner, name: repo } = body.repository;

  try {
    await connectDB();

    const projectPlan = (await ProjectPlan.findOne({
      "github.owner": owner,
      "github.repo": repo,
      "github.enabled": true,
    })) as IProjectPlan | null;

    if (!projectPlan) {
      return NextResponse.json({ ok: true, skipped: "no linked project" });
    }

    const projectPlanId = String(projectPlan._id);
    const userId = String(projectPlan.userId);

    if (event === "issues" && body.issue) {
      await requestGitHubSync({
        projectPlanId,
        userId,
        type: "inbound",
        payload: {
          event: "issues",
          action: body.action,
          issue: body.issue,
        },
      });

      return NextResponse.json({ ok: true, queued: true });
    }

    if (event === "milestone" && body.milestone) {
      await requestGitHubSync({
        projectPlanId,
        userId,
        type: "inbound",
        payload: {
          event: "milestone",
          action: body.action,
          milestone: body.milestone,
        },
      });

      return NextResponse.json({ ok: true, queued: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("GitHub webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
