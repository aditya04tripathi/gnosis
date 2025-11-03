import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PaymentState {
  selectedTier: "MONTHLY" | "YEARLY" | null;
  isMonthly: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  selectedTier: null,
  isMonthly: true,
  isLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setBillingPeriod: (state, action: PayloadAction<boolean>) => {
      state.isMonthly = action.payload;
    },
    setSelectedTier: (
      state,
      action: PayloadAction<"MONTHLY" | "YEARLY" | null>,
    ) => {
      state.selectedTier = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setBillingPeriod, setSelectedTier, setLoading, setError } =
  paymentSlice.actions;
export default paymentSlice.reducer;
