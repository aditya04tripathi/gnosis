import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ProjectPlan, ValidationResult } from "@/types";

interface ValidationState {
  currentValidation: {
    id: string;
    idea: string;
    result: ValidationResult;
  } | null;
  currentProjectPlan: {
    id: string;
    plan: ProjectPlan;
    alternativeIdeas: Array<{
      title: string;
      description: string;
      score: number;
      reasoning: string;
    }>;
  } | null;
  isLoading: boolean;
}

const initialState: ValidationState = {
  currentValidation: null,
  currentProjectPlan: null,
  isLoading: false,
};

const validationSlice = createSlice({
  name: "validation",
  initialState,
  reducers: {
    setValidation: (
      state,
      action: PayloadAction<ValidationState["currentValidation"]>,
    ) => {
      state.currentValidation = action.payload;
    },
    setProjectPlan: (
      state,
      action: PayloadAction<ValidationState["currentProjectPlan"]>,
    ) => {
      state.currentProjectPlan = action.payload;
    },
    updateTaskStatus: (
      state,
      action: PayloadAction<{ taskId: string; status: string }>,
    ) => {
      if (state.currentProjectPlan?.plan) {
        for (const phase of state.currentProjectPlan.plan.phases) {
          const task = phase.tasks.find((t) => t.id === action.payload.taskId);
          if (task) {
            task.status = action.payload.status as
              | "TODO"
              | "IN_PROGRESS"
              | "DONE"
              | "BLOCKED";
            break;
          }
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearValidation: (state) => {
      state.currentValidation = null;
      state.currentProjectPlan = null;
    },
  },
});

export const {
  setValidation,
  setProjectPlan,
  updateTaskStatus,
  setLoading,
  clearValidation,
} = validationSlice.actions;
export default validationSlice.reducer;
