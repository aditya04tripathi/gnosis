"use client";

import { ArrowLeft, ArrowRight, Quotes } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { APP_INFO, TESTIMONIALS } from "@/modules/shared/constants";
import { cn } from "@/modules/shared/lib/utils";

const quotes = [
  {
    body: `${APP_INFO.name} surfaced weaknesses I had papered over. The plan that followed was the first roadmap my co-founder and I both trusted.`,
    name: "Maya Okonkwo",
    role: "Founder, Lattice Health",
    image: "https://picsum.photos/seed/maya-founder/200/200",
  },
  {
    body: "We pivoted two weeks after the validation report instead of six months into a build nobody needed. That alone paid for the habit.",
    name: "Jonah Park",
    role: "Solo founder",
    image: "https://picsum.photos/seed/jonah-founder/200/200",
  },
  {
    body: "Flowcharts plus SCRUM in the same place meant engineering stopped asking me to redraw the plan in yet another doc.",
    name: "Elena Vasquez",
    role: "Product lead, Northwind Labs",
    image: "https://picsum.photos/seed/elena-pm/200/200",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const quote = quotes[index];

  const prev = () => setIndex((i) => (i - 1 + quotes.length) % quotes.length);
  const next = () => setIndex((i) => (i + 1) % quotes.length);

  return (
    <section className="overflow-x-hidden py-24 md:py-40">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mb-16 max-w-xl md:mb-20">
          <h2>{TESTIMONIALS.heading}</h2>
          <p className="mt-4 max-w-[40ch] text-muted-foreground md:text-lg">
            {TESTIMONIALS.description}
          </p>
        </div>

        <div className="rounded-[2rem] bg-white/[0.03] p-1.5 ring-1 ring-white/10">
          <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] bg-card px-6 py-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] md:px-12 md:py-14">
            <Quotes className="mb-8 h-10 w-10 text-primary/50" weight="light" />
            <blockquote
              key={quote.name}
              className="max-w-3xl text-2xl font-medium leading-snug tracking-tight text-foreground md:text-3xl transition-opacity duration-700"
            >
              {quote.body}
            </blockquote>

            <div className="mt-12 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl ring-1 ring-white/10">
                  <Image
                    src={quote.image}
                    alt={quote.name}
                    fill
                    className="object-cover grayscale contrast-125"
                    sizes="56px"
                  />
                </div>
                <div>
                  <p className="font-medium">{quote.name}</p>
                  <p className="text-sm text-muted-foreground">{quote.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous quote"
                  className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/5 active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" weight="light" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next quote"
                  className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/5 active:scale-95"
                >
                  <ArrowRight className="h-4 w-4" weight="light" />
                </button>
                <div className="ml-3 flex gap-1.5">
                  {quotes.map((q, i) => (
                    <button
                      key={q.name}
                      type="button"
                      aria-label={`Go to quote ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                        i === index
                          ? "w-6 bg-primary"
                          : "w-1.5 bg-white/20 hover:bg-white/40",
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
