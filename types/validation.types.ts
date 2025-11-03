export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  recommendedTier: "MONTHLY" | "YEARLY";
  marketAnalysis: string;
  competition: string[];
  targetAudience: string;
}

export interface ProjectPlan {
  phases: ProjectPhase[];
  estimatedDuration: string;
  estimatedCost: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  dependencies: string[];
  tasks: ProjectTask[];
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignee?: string;
  dueDate?: Date;
  tags: string[];
  phaseId: string;
}

export interface FlowchartNode {
  id: string;
  type: "start" | "process" | "decision" | "end";
  label: string;
  data: {
    description?: string;
    phaseId?: string;
  };
  position: { x: number; y: number };
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: "default" | "smoothstep";
}

export interface AlternativeIdea {
  title: string;
  description: string;
  score: number;
  reasoning: string;
}
