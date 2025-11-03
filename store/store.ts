import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import paymentSlice from "./slices/paymentSlice";
import validationSlice from "./slices/validationSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    payment: paymentSlice,
    validation: validationSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
