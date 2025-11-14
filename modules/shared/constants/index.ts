export * from "./app-info";

export const FREE_SEARCHES_LIMIT = 1;

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    searchesPerMonth: 1,
    features: [
      "1 AI validation per 2 days",
      "Basic project plans",
      "Flowchart visualization",
    ],
  },
} as const;

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
