import { LayoutGrid, Lightbulb, Workflow } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectBoards } from "@/modules/project/components/project-boards";
import { ProjectFlowchart } from "@/modules/project/components/project-flowchart";
import { ProjectHeader } from "@/modules/project/components/project-header";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shared/components/ui/tabs";
import { auth } from "@/modules/shared/lib/auth";
import connectDB from "@/modules/shared/lib/db";
import ProjectPlan from "@/modules/shared/models/ProjectPlan";

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

  const serializedPlan = JSON.parse(JSON.stringify(projectPlan.plan));

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">← Back to Dashboard</Button>
            </Link>
            <ProjectHeader projectPlanId={id} plan={serializedPlan} />
            <p className="text-muted-foreground">
              Created {new Date(projectPlan.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h4>Estimated Duration</h4>
                </CardTitle>
              </CardHeader>
              <CardContent>{projectPlan.plan.estimatedDuration}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  <h4>Estimated Cost</h4>
                </CardTitle>
              </CardHeader>
              <CardContent>{projectPlan.plan.estimatedCost}</CardContent>
            </Card>
            <Card
              className={
                projectPlan.plan.riskLevel === "LOW"
                  ? "bg-primary"
                  : projectPlan.plan.riskLevel === "MEDIUM"
                    ? "bg-secondary"
                    : "bg-destructive"
              }
            >
              <CardHeader>
                <CardTitle>
                  <h4>Risk Level</h4>
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
                >
                  {projectPlan.plan.riskLevel}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {projectPlan.alternativeIdeas &&
            projectPlan.alternativeIdeas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    <h4>Alternative Ideas</h4>
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
                          <CardTitle>
                            <h4>{idea.title}</h4>
                          </CardTitle>
                          <CardDescription>
                            <p className="text-sm text-muted-foreground">
                              {idea.reasoning}
                            </p>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex grow">
                          {idea.description}
                        </CardContent>
                        <CardFooter>
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
                              Validate This Idea ({idea.score}/100)
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  <CardTitle>
                    <h4>Project Flowchart</h4>
                  </CardTitle>
                  <CardDescription>
                    Visual representation of your project phases and
                    dependencies
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5">
                  <ProjectFlowchart plan={serializedPlan} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="boards" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h4>SCRUM Boards</h4>
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
