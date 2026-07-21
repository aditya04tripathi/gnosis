"use client";

import { Brain, GitBranch, Layout, Sparkle } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import { FEATURES } from "@/modules/shared/constants";
import { cn } from "@/modules/shared/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type PhosphorIcon = ComponentType<{
  className?: string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
}>;

const iconMap: Record<string, PhosphorIcon> = {
  brain: Brain,
  gitBranch: GitBranch,
  layoutGrid: Layout,
  sparkle: Sparkle,
};

export default function Features12() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll("[data-feature-card]");
      if (!cards?.length) return;

      gsap.fromTo(
        cards,
        { y: 48, opacity: 0, filter: "blur(8px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            once: true,
          },
        },
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative overflow-x-hidden py-24 md:py-40"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mb-16 max-w-2xl md:mb-24">
          <h2>{FEATURES.heading}</h2>
          <p className="mt-4 max-w-[42ch] text-pretty text-muted-foreground md:text-lg">
            {FEATURES.description}
          </p>
        </div>

        <div
          ref={cardsRef}
          className="grid auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 md:grid-cols-12 md:grid-flow-dense md:gap-5"
        >
          {FEATURES.items.map((feature, index) => {
            const Icon = iconMap[feature.icon] ?? Brain;
            const isFeatured = index === 0;
            const isTall = index === 1;
            const span = isFeatured
              ? "md:col-span-7 md:row-span-2"
              : isTall
                ? "md:col-span-5 md:row-span-2"
                : index === 2
                  ? "md:col-span-5"
                  : "md:col-span-7";

            return (
              <button
                key={feature.title}
                type="button"
                data-feature-card
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "group text-left transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99]",
                  span,
                )}
              >
                <div
                  className={cn(
                    "h-full rounded-[2rem] bg-white/[0.03] p-1.5 ring-1 ring-white/10",
                    active === index && "ring-primary/40",
                  )}
                >
                  <div
                    className={cn(
                      "relative flex h-full flex-col justify-between overflow-hidden rounded-[calc(2rem-0.375rem)] bg-card p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] md:p-8",
                      isFeatured && "min-h-[22rem]",
                      isTall && "min-h-[22rem]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Icon
                        className="h-7 w-7 text-primary/80 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110"
                        weight="light"
                      />
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="mt-10">
                      <h3 className="text-xl md:text-2xl">{feature.title}</h3>
                      <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-muted-foreground md:text-base">
                        {feature.description}
                      </p>
                    </div>
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                      aria-hidden
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
