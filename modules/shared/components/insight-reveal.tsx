"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const WORDS =
  "Great founders do not guess their way into product-market fit. They pressure-test the story, map the risk, and only then commit months of build time."
    .split(" ")
    .map((word, position) => ({ id: `w-${position}-${word}`, word }));

export default function InsightReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        wordsRef.current,
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            end: "bottom 45%",
            scrub: true,
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-x-hidden py-32 md:py-48"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <p className="text-center text-[clamp(1.75rem,4vw,3.25rem)] font-medium leading-[1.25] tracking-tight text-balance">
          {WORDS.map((item, i) => (
            <span
              key={item.id}
              ref={(el) => {
                if (el) wordsRef.current[i] = el;
              }}
              className="inline-block mr-[0.28em]"
            >
              {item.word}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
