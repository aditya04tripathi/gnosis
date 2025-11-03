import Groq from "groq-sdk";
import type { AlternativeIdea, ProjectPlan, ValidationResult } from "@/types";

if (!process.env.GROQ_API_KEY) {
  throw new Error("Please add GROQ_API_KEY to your environment variables");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function validateIdea(idea: string): Promise<ValidationResult> {
  const prompt = `You are an expert startup validator and business analyst. Analyze the following startup idea and provide a comprehensive validation:

${idea}

Provide your response in JSON format with the following structure:
{
  "isValid": boolean,
  "score": number (0-100),
  "feedback": string (detailed feedback in 2-3 paragraphs),
  "strengths": string[] (array of 3-5 strengths),
  "weaknesses": string[] (array of 3-5 weaknesses),
  "suggestions": string[] (array of 5-7 actionable suggestions),
  "recommendedTier": "MONTHLY" | "YEARLY" (recommended billing period based on idea complexity and potential),
  "marketAnalysis": string (2-3 paragraph market analysis),
  "competition": string[] (array of 3-5 main competitors or similar products),
  "targetAudience": string (detailed description of target audience)
}

Be thorough, realistic, and constructive in your analysis.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert startup validator with deep knowledge in business strategy, market analysis, and product development. Provide structured, JSON-formatted responses only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq");
    }

    const result = JSON.parse(content) as ValidationResult;
    return result;
  } catch (error) {
    console.error("Groq validation error:", error);
    throw new Error("Failed to validate idea");
  }
}

export async function generateProjectPlan(
  idea: string,
  validationResult: ValidationResult,
): Promise<ProjectPlan> {
  const prompt = `Based on this startup idea and validation:

Idea: ${idea}
Score: ${validationResult.score}/100
Strengths: ${validationResult.strengths.join(", ")}
Weaknesses: ${validationResult.weaknesses.join(", ")}

Create a detailed project plan with phases and tasks. Provide your response in JSON format:
{
  "phases": [
    {
      "id": string,
      "name": string,
      "description": string,
      "duration": string (e.g., "2-3 weeks"),
      "dependencies": string[] (array of phase IDs this depends on),
      "tasks": [
        {
          "id": string,
          "title": string,
          "description": string,
          "status": "TODO",
          "priority": "LOW" | "MEDIUM" | "HIGH",
          "tags": string[],
          "phaseId": string
        }
      ]
    }
  ],
  "estimatedDuration": string (total estimated duration),
  "estimatedCost": string (estimated cost range),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "priority": "LOW" | "MEDIUM" | "HIGH"
}

Create 4-6 phases covering: Research & Planning, MVP Development, Testing & Iteration, Launch Preparation, Marketing & Growth, and Scaling. Include 5-10 tasks per phase.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert project manager and product strategist. Create detailed, actionable project plans with phases and tasks. Provide structured JSON responses only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq");
    }

    const result = JSON.parse(content) as ProjectPlan;
    return result;
  } catch (error) {
    console.error("Groq project plan error:", error);
    throw new Error("Failed to generate project plan");
  }
}

export async function generateAlternativeIdeas(
  idea: string,
): Promise<AlternativeIdea[]> {
  const prompt = `Generate 3-5 alternative startup ideas related to or inspired by this concept:

${idea}

Provide your response in JSON format:
{
  "alternatives": [
    {
      "title": string,
      "description": string (2-3 sentences),
      "score": number (0-100, potential score),
      "reasoning": string (why this is a good alternative, 1-2 sentences)
    }
  ]
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a creative startup ideator. Generate innovative, viable alternative ideas. Provide structured JSON responses only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq");
    }

    const result = JSON.parse(content) as { alternatives: AlternativeIdea[] };
    return result.alternatives;
  } catch (error) {
    console.error("Groq alternative ideas error:", error);
    throw new Error("Failed to generate alternative ideas");
  }
}
