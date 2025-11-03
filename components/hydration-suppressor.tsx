"use client";

import { useEffect } from "react";
import { suppressHydrationWarnings } from "@/lib/suppress-hydration-warnings";

/**
 * Client component that suppresses hydration warnings globally
 * This should be included in the root layout
 */
export function HydrationSuppressor() {
  useEffect(() => {
    suppressHydrationWarnings();
  }, []);

  return null;
}
