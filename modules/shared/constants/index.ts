export * from "./app-info";

export const FREE_SEARCHES_LIMIT = 1;
export const MONTHLY_SEARCHES_LIMIT = 50;

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free",
    tier: "FREE" as const,
    name: "Free Starter",
    price: "$0",
    period: "forever",
    priceAmount: 0,
    searchesPerMonth: 1,
    description: "Essential validation tools for early-stage idea exploration.",
    features: [
      "1 AI validation per 2 days",
      "Basic project plans & milestones",
      "Interactive flowchart visualization",
      "Manual GitHub repository linking",
      "Community support",
    ],
    highlighted: false,
    cta: "Get Started Free",
  },
  MONTHLY: {
    id: "monthly",
    tier: "MONTHLY" as const,
    name: "Pro Monthly",
    price: "$19",
    period: "per month",
    priceAmount: 19,
    searchesPerMonth: 50,
    description: "Accelerate execution with advanced AI planning and bi-directional GitHub sync.",
    badge: "Most Popular",
    features: [
      "50 AI validations per month",
      "Phased project roadmaps with AI plan refinement",
      "Bi-directional GitHub sync (Issues & Milestones)",
      "Interactive SCRUM board with drag & drop",
      "Multi-model AI support (Groq, OpenAI, Anthropic, Gemini)",
      "Priority email support",
    ],
    highlighted: true,
    cta: "Upgrade to Pro",
  },
  YEARLY: {
    id: "yearly",
    tier: "YEARLY" as const,
    name: "Pro Annual",
    price: "$190",
    period: "per year ($15.83/mo)",
    priceAmount: 190,
    searchesPerMonth: Infinity,
    description: "Uncapped power for founders shipping serious software products.",
    badge: "Best Value (Save 17%)",
    features: [
      "Unlimited AI validations",
      "Instant GitHub webhook sync & automated issue linking",
      "Custom AI endpoints & Bring-Your-Own-Key (BYOK)",
      "Full export (Markdown, PDF, JSON)",
      "Unlimited active projects & roadmaps",
      "24/7 Priority founder support",
    ],
    highlighted: false,
    cta: "Get Pro Annual",
  },
  ULTRA: {
    id: "ultra",
    tier: "ULTRA" as const,
    name: "Ultra",
    price: "$49",
    period: "per month",
    priceAmount: 49,
    searchesPerMonth: Infinity,
    description: "Autonomous roadmap execution and maximum intelligence for elite software engineers.",
    badge: "Maximum Power",
    features: [
      "Unlimited AI validations with zero cooldowns",
      "Autonomous roadmap execution & GitHub issue generator",
      "Full Multi-Model AI Access + BYOK & Custom Base URLs",
      "Full codebase repository scaffolding & PR generation",
      "Interactive SCRUM board with automated sprint planning",
      "24/7 VIP founder support & priority compute queue",
    ],
    highlighted: false,
    cta: "Upgrade to Ultra",
  },
} as const;

export const CREDITS_PACK = {
  id: "credits_10",
  name: "10 Validation Booster",
  price: "$9",
  credits: 10,
  description: "One-time credit pack. Validations never expire.",
} as const;

export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

export function getPlanForTier(tier?: string) {
  if (tier === "ULTRA") return SUBSCRIPTION_PLANS.ULTRA;
  if (tier === "YEARLY") return SUBSCRIPTION_PLANS.YEARLY;
  if (tier === "MONTHLY") return SUBSCRIPTION_PLANS.MONTHLY;
  return SUBSCRIPTION_PLANS.FREE;
}

export function getSearchLimitForTier(tier?: string): number {
  if (tier === "ULTRA" || tier === "YEARLY") return Infinity;
  if (tier === "MONTHLY") return MONTHLY_SEARCHES_LIMIT;
  return FREE_SEARCHES_LIMIT;
}

export const RATE_LIMIT = {
  VALIDATION: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
  API: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },
} as const;

export const CACHE_TTL = {
  VALIDATION: 60 * 60,
  USER: 5 * 60,
  PROJECT: 30 * 60,
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
} as const;
