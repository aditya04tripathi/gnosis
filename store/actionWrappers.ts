"use client";

import type { SubscriptionTier } from "@/types";
import { updateUser } from "./slices/authSlice";
import {
  setProjectPlan,
  updateTaskStatus as updateTaskStatusRedux,
} from "./slices/validationSlice";
import type { AppDispatch } from "./store";

/**
 * Client-side helpers to sync Redux store with server action results
 * Use these functions after calling server actions that modify database state
 */

/**
 * Syncs user data from server action result to Redux store
 * Use this after actions that return user data (payment, validation, profile updates)
 */
export function syncUserToRedux(
  dispatch: AppDispatch,
  userData: {
    subscriptionTier?: SubscriptionTier;
    subscriptionPlan?: "BASIC" | "PRO";
    searchesUsed?: number;
    searchesResetAt?: Date | string;
    name?: string;
  },
) {
  if (Object.keys(userData).length > 0) {
    // Serialize Date objects to ISO strings for Redux
    const serializedData = {
      ...userData,
      ...(userData.searchesResetAt && {
        searchesResetAt:
          userData.searchesResetAt instanceof Date
            ? userData.searchesResetAt.toISOString()
            : userData.searchesResetAt,
      }),
    };
    dispatch(updateUser(serializedData));
  }
}

/**
 * Syncs project plan data from server action result to Redux store
 * Use this after generatePlan or similar actions
 */
export function syncProjectPlanToRedux(
  dispatch: AppDispatch,
  projectPlan: {
    id: string;
    plan: {
      phases: Array<{
        id: string;
        name: string;
        description: string;
        duration: string;
        dependencies: string[];
        tasks: Array<{
          id: string;
          title: string;
          description: string;
          status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
          priority: "LOW" | "MEDIUM" | "HIGH";
          tags: string[];
          phaseId: string;
        }>;
      }>;
      estimatedDuration: string;
      estimatedCost: string;
      riskLevel: "LOW" | "MEDIUM" | "HIGH";
      priority: "LOW" | "MEDIUM" | "HIGH";
    };
    alternativeIdeas: Array<{
      title: string;
      description: string;
      score: number;
      reasoning: string;
    }>;
  },
) {
  dispatch(setProjectPlan(projectPlan));
}

/**
 * Updates task status in Redux store
 * Use this after updateTaskStatus server action
 */
export function updateTaskStatusReduxWrapper(
  dispatch: AppDispatch,
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
) {
  dispatch(updateTaskStatusRedux({ taskId, status }));
}
