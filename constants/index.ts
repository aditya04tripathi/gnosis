export const FREE_SEARCHES_LIMIT = 5;

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    searchesPerMonth: 5,
    features: [
      "5 AI validations",
      "Basic project plans",
      "Flowchart visualization",
    ],
  },
  BASIC: {
    name: "Basic",
    monthlyPrice: 19,
    yearlyPrice: 190,
    searchesPerMonth: 50,
    features: [
      "50 AI validations/month",
      "Advanced project plans",
      "SCRUM boards",
      "Email support",
    ],
  },
  PRO: {
    name: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 490,
    searchesPerMonth: Infinity,
    features: [
      "Unlimited AI validations",
      "Advanced project plans",
      "SCRUM boards",
      "Priority support",
      "AI plan improvements",
      "Export capabilities",
    ],
  },
} as const;

export const RATE_LIMIT = {
  VALIDATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
} as const;

export const CACHE_TTL = {
  VALIDATION: 60 * 60, // 1 hour
  USER: 5 * 60, // 5 minutes
  PROJECT: 30 * 60, // 30 minutes
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
} as const;
