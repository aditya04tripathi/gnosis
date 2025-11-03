"use client";

import { Loader2, Terminal } from "lucide-react";
import { useEffect, useState } from "react";

const techJokes = [
  "Optimizing blockchain... wait, wrong project.",
  "Compiling dad jokes into machine code...",
  "Dividing by zero... just kidding!",
  "Initializing quantum entanglement...",
  "Converting coffee into code...",
  "Caching your patience...",
  "Reticulating splines...",
  "Calibrating awesomeness levels...",
  "Teaching AI to appreciate memes...",
  "Running on someone else's computer (cloud)...",
];

const loadingSteps = [
  "[*] Booting up Gnosis OS...",
  "[*] Initializing neural pathways...",
  "[*] Loading startup wisdom...",
  "[*] Calibrating idea validator...",
  "[*] Almost there, just a moment...",
];

export default function Loading() {
  const [currentJoke, setCurrentJoke] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const jokeInterval = setInterval(() => {
      setCurrentJoke((prev) => (prev + 1) % techJokes.length);
    }, 2500);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 800);

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => {
      clearInterval(jokeInterval);
      clearInterval(stepInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-semibold text-foreground">
              gnosis@terminal:~$
            </span>
            <Loader2 className="ml-auto h-5 w-5 animate-spin text-muted-foreground" />
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div className="text-muted-foreground">
              {loadingSteps[currentStep]}
              <span className="inline-block w-4 text-primary">{dots}</span>
            </div>

            <div className="mt-6 rounded bg-muted/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {"// "}
                  {techJokes[currentJoke]}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="animate-pulse">█</span>
              <span>Press Ctrl+C to cancel (just kidding, this is automatic)</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50"
                style={{
                  animation: "loading-shimmer 2s ease-in-out infinite",
                }}
              />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              ∞%
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            {"> "}
            <span className="animate-pulse">while (loading) coffee++;</span>
          </p>
        </div>
      </div>
    </div>
  );
}

