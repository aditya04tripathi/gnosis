import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { SUBSCRIPTION_PLANS } from "@/constants";
import type { SubscriptionTier } from "@/types";

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    subscriptionTier: SubscriptionTier;
    searchesUsed: number;
    searchesRemaining: number;
  } | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState["user"]>) => {
      state.user = action.payload;
    },
    updateSubscription: (state, action: PayloadAction<SubscriptionTier>) => {
      if (state.user) {
        state.user.subscriptionTier = action.payload;
        state.user.searchesUsed = 0;
      }
    },
    updateUser: (
      state,
      action: PayloadAction<{
        subscriptionTier?: SubscriptionTier;
        subscriptionPlan?: "BASIC" | "PRO";
        searchesUsed?: number;
        searchesResetAt?: Date | string;
        name?: string;
      }>,
    ) => {
      if (state.user) {
        if (action.payload.name !== undefined) {
          // Name update doesn't affect searches, just update it
        }
        if (action.payload.subscriptionTier !== undefined) {
          state.user.subscriptionTier = action.payload.subscriptionTier;
        }
        if (action.payload.searchesUsed !== undefined) {
          state.user.searchesUsed = action.payload.searchesUsed;
          // Recalculate remaining searches based on current subscription
          const currentTier =
            action.payload.subscriptionTier ?? state.user.subscriptionTier;
          const currentPlan = action.payload.subscriptionPlan;

          let searchesPerMonth: number;
          if (currentTier === "FREE") {
            searchesPerMonth = SUBSCRIPTION_PLANS.FREE.searchesPerMonth;
          } else if (currentPlan === "PRO") {
            searchesPerMonth = SUBSCRIPTION_PLANS.PRO.searchesPerMonth;
          } else {
            searchesPerMonth = SUBSCRIPTION_PLANS.BASIC.searchesPerMonth;
          }

          state.user.searchesRemaining = Math.max(
            0,
            searchesPerMonth === Infinity
              ? Infinity
              : searchesPerMonth - action.payload.searchesUsed,
          );
        }
      }
    },
    incrementSearches: (state) => {
      if (state.user) {
        state.user.searchesUsed += 1;
        if (state.user.searchesRemaining > 0) {
          state.user.searchesRemaining -= 1;
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
  },
});

export const {
  setUser,
  updateSubscription,
  updateUser,
  incrementSearches,
  setLoading,
  logout,
} = authSlice.actions;
export default authSlice.reducer;
