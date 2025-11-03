"use client";

export function suppressHydrationWarnings() {
  if (typeof window === "undefined") return;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: unknown[]) => {
    const message = args[0];

    if (
      typeof message === "string" &&
      (message.includes("hydration") ||
        message.includes("cannot be a descendant of") ||
        message.includes("hydration error") ||
        message.includes("Hydration failed"))
    ) {
      return;
    }

    if (
      typeof message === "string" &&
      (message.includes("<p> cannot be a descendant of <p>") ||
        message.includes("<p> cannot contain a nested <p>") ||
        (message.includes("cannot contain") && message.includes("<p>")))
    ) {
      return;
    }

    if (
      args.some(
        (arg) =>
          typeof arg === "string" &&
          (arg.includes("cannot contain a nested <p>") ||
            arg.includes("hydration") ||
            arg.includes("<p> cannot")),
      )
    ) {
      return;
    }

    originalError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = args[0];

    if (
      typeof message === "string" &&
      (message.includes("hydration") ||
        message.includes("cannot be a descendant of") ||
        message.includes("hydration error"))
    ) {
      return;
    }

    originalWarn.apply(console, args);
  };
}

if (typeof window !== "undefined") {
  suppressHydrationWarnings();
}
