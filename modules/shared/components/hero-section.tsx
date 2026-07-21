"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { APP_INFO, HERO_SECTION } from "@/modules/shared/constants";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scale: 0.88, opacity: 0.45 },
        {
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 25%",
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-[100dvh] overflow-hidden ambient-mesh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,transparent_0%,var(--background)_72%)]"
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-4 pb-16 pt-28 md:px-6 md:pb-24 md:pt-36 lg:px-8">
        <div className="relative z-10 max-w-3xl md:max-w-5xl">
          <p className="mb-6 font-semibold text-[clamp(2rem,4vw,3.5rem)] leading-none tracking-tighter text-foreground">
            {APP_INFO.name}
          </p>
          <h1 className="max-w-5xl text-balance">{HERO_SECTION.heading}</h1>
          <p className="mt-6 max-w-[38ch] text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            {HERO_SECTION.subheading}
          </p>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href={HERO_SECTION.cta.primary.href}
              className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:brightness-110 active:scale-[0.98]"
            >
              <span>{HERO_SECTION.cta.primary.text}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
                <ArrowUpRight className="h-4 w-4" weight="light" />
              </span>
            </Link>
            <Link
              href={HERO_SECTION.cta.secondary.href}
              className="inline-flex items-center rounded-full px-5 py-3 text-sm font-medium text-muted-foreground transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-foreground"
            >
              {HERO_SECTION.cta.secondary.text}
            </Link>
          </div>
        </div>

        <div
          ref={imageRef}
          className="relative mt-16 w-full md:mt-20 will-change-transform"
        >
          <div className="absolute -inset-x-8 -bottom-24 top-1/3 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(74,222,155,0.14),transparent_65%)]" />
          <div className="relative w-full overflow-hidden rounded-none md:rounded-[1.5rem]">
            <div className="relative aspect-[16/10] w-full md:aspect-[15/8]">
              <Image
                src="/mail2.png"
                alt="Gnosis validation workspace"
                fill
                priority
                className="object-cover object-top contrast-125 opacity-95"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
