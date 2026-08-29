import { z } from "zod";
import { generateStructuredObject } from "@/modules/shared/lib/ai-structured";
import { clipIdeaText } from "@/modules/shared/lib/groq-client";
import type {
  AlternativeIdea,
  ProjectPlan,
  ValidationResult,
} from "@/modules/validation/types/validation.types";

const validationResultSchema = z.object({
  isValid: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  suggestions: z.array(z.string()).min(1),
  recommendedTier: z.enum(["MONTHLY", "YEARLY"]),
  marketAnalysis: z.string(),
  competition: z.array(z.string()).min(1),
  targetAudience: z.string(),
});

const projectTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  tags: z.array(z.string()),
  phaseId: z.string(),
});

const projectPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  duration: z.string(),
  dependencies: z.array(z.string()),
  tasks: z.array(projectTaskSchema),
});

const projectPlanSchema = z.object({
  phases: z.array(projectPhaseSchema).min(1),
  estimatedDuration: z.string(),
  estimatedCost: z.string(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

const alternativeIdeasSchema = z.object({
  alternatives: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      score: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
  ),
});

export async function validateIdea(idea: string): Promise<ValidationResult> {
  const trimmedIdea = clipIdeaText(idea);
  const prompt = `Analyze the following startup idea and provide a comprehensive validation:

${trimmedIdea}

Be thorough, realistic, and constructive in your analysis.`;

  try {
    return await generateStructuredObject({
      role: "structured",
      system:
        "You are an expert startup validator with deep knowledge in business strategy, market analysis, and product development.",
      prompt,
      schema: validationResultSchema,
      temperature: 0.5,
      maxOutputTokens: 4096,
    });
  } catch (error) {
    console.error("Idea validation error:", error);
    throw new Error("Failed to validate idea");
  }
}

export async function generateProjectPlan(
  idea: string,
  validationResult: ValidationResult,
): Promise<ProjectPlan> {
  const trimmedIdea = clipIdeaText(idea);
  const prompt = `Based on this startup idea and validation:

Idea: ${trimmedIdea}
Score: ${validationResult.score}/100
Strengths: ${validationResult.strengths.join(", ")}
Weaknesses: ${validationResult.weaknesses.join(", ")}

Create a detailed project plan with phases and tasks.
Create 4-6 phases covering: Research & Planning, MVP Development, Testing & Iteration, Launch Preparation, Marketing & Growth, and Scaling. Include 5-10 tasks per phase.`;

  try {
    return await generateStructuredObject({
      role: "structured",
      system:
        "You are an expert project manager and product strategist. Create detailed, actionable project plans with phases and tasks.",
      prompt,
      schema: projectPlanSchema,
      temperature: 0.5,
      maxOutputTokens: 8192,
    });
  } catch (error) {
    console.error("Project plan generation error:", error);
    throw new Error("Failed to generate project plan");
  }
}

export async function generateAlternativeIdeas(
  idea: string,
): Promise<AlternativeIdea[]> {
  const trimmedIdea = clipIdeaText(idea);
  const prompt = `Generate 3-5 alternative startup ideas related to or inspired by this concept:

${trimmedIdea}`;

  try {
    const result = await generateStructuredObject({
      role: "creative",
      system:
        "You are a creative startup ideator. Generate innovative, viable alternative ideas.",
      prompt,
      schema: alternativeIdeasSchema,
      temperature: 0.8,
      maxOutputTokens: 2048,
    });

    return result.alternatives;
  } catch (error) {
    console.error("Alternative ideas generation error:", error);
    throw new Error("Failed to generate alternative ideas");
  }
}
