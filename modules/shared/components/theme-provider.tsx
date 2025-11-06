"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: "AUD",
        intent: "capture",
        vault: true,
        environment:
          process.env.NEXT_PUBLIC_PAYPAL_MODE! === "sandbox"
            ? "sandbox"
            : "production",
      }}
    >
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </PayPalScriptProvider>
  );
}
