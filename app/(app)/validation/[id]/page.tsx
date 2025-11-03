import {
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GeneratePlanButton } from "@/components/generate-plan-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import connectDB from "@/lib/db";
import ProjectPlan from "@/models/ProjectPlan";
import Validation from "@/models/Validation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const validation = await Validation.findById(id).lean();

  if (!validation) {
    return {
      title: "Validation Not Found",
    };
  }

  return {
    title: `Validation: ${validation.idea.slice(0, 60)}...`,
    description: `Validation results for: ${validation.idea.slice(0, 100)}...`,
  };
}

export default async function ValidationPage({
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
  const validation = await Validation.findById(id).lean();

  if (!validation || validation.userId.toString() !== session.user.id) {
    redirect("/dashboard");
  }

  const projectPlan = validation.projectPlanId
    ? await ProjectPlan.findById(validation.projectPlanId).lean()
    : null;

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">← Back to Dashboard</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Validation Results
              </h1>
              <p className="mt-2 text-muted-foreground">
                {new Date(validation.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Idea */}
          <Card>
            <CardHeader>
              <CardTitle>Your Idea</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{validation.idea}</p>
            </CardContent>
          </Card>

          {/* Validation Result */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Validation Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {validation.validationResult.score}
                  </span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <Badge
                  variant={
                    validation.validationResult.isValid
                      ? "default"
                      : "destructive"
                  }
                  className="mt-4"
                >
                  {validation.validationResult.isValid ? (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {validation.validationResult.isValid ? "Valid" : "Needs Work"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommended Billing Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-lg">
                  {validation.validationResult.recommendedTier}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Feedback</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {validation.validationResult.feedback}
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Strengths
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {validation.validationResult.strengths.map((strength) => (
                    <li key={strength}>{strength}</li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Weaknesses
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {validation.validationResult.weaknesses.map((weakness) => (
                    <li key={weakness}>{weakness}</li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-accent-foreground" />
                  Suggestions
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {validation.validationResult.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Analysis</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {validation.validationResult.marketAnalysis}
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Audience
                </h3>
                <p className="text-sm text-muted-foreground">
                  {validation.validationResult.targetAudience}
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">Competition</h3>
                <div className="flex flex-wrap gap-2">
                  {validation.validationResult.competition.map((comp) => (
                    <Badge key={comp} variant="secondary">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Project Plan */}
          {!projectPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Generate Project Plan</CardTitle>
                <CardDescription>
                  Get a detailed project plan with phases, tasks, and flowcharts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeneratePlanButton validationId={id} />
              </CardContent>
            </Card>
          )}

          {/* Project Plan Link */}
          {projectPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Project Plan Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild size="lg">
                  <Link href={`/project/${projectPlan._id}`}>
                    View Project Plan →
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
