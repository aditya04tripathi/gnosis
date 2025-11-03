import type { DefaultSession } from "next-auth";
import type { SubscriptionTier } from "./auth.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscriptionTier: SubscriptionTier;
      searchesUsed: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    subscriptionTier: SubscriptionTier;
    searchesUsed: number;
  }
}
