import { LayoutGrid, Lightbulb, Workflow } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProjectBoards } from "@/components/project-boards";
// import Validation from "@/models/Validation";
import { ProjectFlowchart } from "@/components/project-flowchart";
import { ProjectHeader } from "@/components/project-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import connectDB from "@/lib/db";
import ProjectPlan from "@/models/ProjectPlan";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const projectPlan = await ProjectPlan.findById(id).lean();

  if (!projectPlan) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `Project Plan`,
    description: `Detailed project plan with phases, tasks, and visualizations`,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  await connectDB();
  const projectPlan = await ProjectPlan.findById(id).lean();

  if (!projectPlan || projectPlan.userId.toString() !== session.user.id) {
    redirect("/dashboard");
  }

  // Serialize MongoDB ObjectIds to plain objects for client components
  const serializedPlan = JSON.parse(JSON.stringify(projectPlan.plan));

  // const validation = await Validation.findById(projectPlan.validationId).lean();

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">← Back to Dashboard</Button>
            </Link>
            <ProjectHeader projectPlanId={id} plan={serializedPlan} />
            <p className="text-muted-foreground">
              Created {new Date(projectPlan.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Project Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Estimated Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {projectPlan.plan.estimatedDuration}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Estimated Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {projectPlan.plan.estimatedCost}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Risk Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    projectPlan.plan.riskLevel === "LOW"
                      ? "default"
                      : projectPlan.plan.riskLevel === "MEDIUM"
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-lg"
                >
                  {projectPlan.plan.riskLevel}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Alternative Ideas */}
          {projectPlan.alternativeIdeas &&
            projectPlan.alternativeIdeas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Alternative Ideas
                  </CardTitle>
                  <CardDescription>
                    Other startup ideas inspired by your concept
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projectPlan.alternativeIdeas.map((idea) => (
                      <Card key={idea.title}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {idea.title}
                          </CardTitle>
                          <CardDescription>{idea.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Badge variant="outline">
                              Score: {idea.score}/100
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {idea.reasoning}
                            </p>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="w-full mt-4"
                            >
                              <Link
                                href={`/validate?idea=${encodeURIComponent(
                                  idea.description || idea.title,
                                )}`}
                              >
                                Validate This Idea
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="flowchart" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="flowchart"
                className="flex items-center gap-2"
              >
                <Workflow className="h-4 w-4" />
                Flowchart
              </TabsTrigger>
              <TabsTrigger value="boards" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                SCRUM
              </TabsTrigger>
            </TabsList>
            <TabsContent value="flowchart" className="mt-6">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Project Flowchart</CardTitle>
                  <CardDescription>
                    Visual representation of your project phases and
                    dependencies
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ProjectFlowchart plan={serializedPlan} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="boards" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    SCRUM Boards
                  </CardTitle>
                  <CardDescription>
                    Manage your project tasks with SCRUM boards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectBoards projectPlanId={id} plan={serializedPlan} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
