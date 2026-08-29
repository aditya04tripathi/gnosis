import { NextResponse } from "next/server";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import ProjectIssue from "@/modules/shared/models/ProjectIssue";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const projectPlan = await ProjectPlan.findById(id).lean();
  if (!projectPlan || projectPlan.userId.toString() !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const issues = await ProjectIssue.find({ projectPlanId: id }).lean();
  const format = new URL(_request.url).searchParams.get("format") ?? "json";

  if (format === "csv") {
    const headers = [
      "number",
      "type",
      "title",
      "status",
      "priority",
      "labels",
      "createdAt",
    ];
    const rows = issues.map((issue) =>
      [
        issue.number,
        issue.type,
        `"${issue.title.replace(/"/g, '""')}"`,
        issue.status,
        issue.priority,
        `"${issue.labels.join(", ")}"`,
        new Date(issue.createdAt).toISOString(),
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gnosis-project-${id}.csv"`,
      },
    });
  }

  return NextResponse.json({
    project: {
      id,
      plan: projectPlan.plan,
      milestones: projectPlan.milestones,
      github: projectPlan.github
        ? { owner: projectPlan.github.owner, repo: projectPlan.github.repo }
        : null,
    },
    issues,
    exportedAt: new Date().toISOString(),
  });
}
