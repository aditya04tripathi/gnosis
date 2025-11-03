"use client";

import { useEffect } from "react";
import { suppressHydrationWarnings } from "@/modules/shared/lib/suppress-hydration-warnings";

export function HydrationSuppressor() {
  useEffect(() => {
    suppressHydrationWarnings();
  }, []);

  return null;
}
