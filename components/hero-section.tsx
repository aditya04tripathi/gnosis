import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { HeroHeader } from "./header";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-0 -z-20"
            >
              <Image
                src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                alt="background"
                className="hidden size-full dark:block"
                width="3276"
                height="4095"
              />
            </AnimatedGroup>

            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,hsl(var(--background))_75%)]"
            />

            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    href="/validate"
                    className="hover:bg-background hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-colors duration-300 border-t-border/5"
                  >
                    <span className="text-foreground text-sm">
                      AI-Powered Startup Idea Validation
                    </span>
                    <span className="block h-4 w-0.5 border-l bg-foreground/20 border-border"></span>

                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedGroup>

                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mx-auto mt-8 max-w-4xl text-balance text-5xl max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]"
                >
                  Validate Your Startup Ideas with AI
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-balance text-lg"
                >
                  Get detailed feedback, project plans, and actionable insights
                  to bring your startup idea to life.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base"
                    >
                      <Link href="/validate">
                        <span className="text-nowrap">Validate Your Idea</span>
                      </Link>
                    </Button>
                  </div>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div className="inset-shadow-2xs ring-background inset-shadow-foreground/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-black/15 ring-1">
                  <Image
                    className="bg-background aspect-15/8 relative hidden rounded-2xl border border-border/25 dark:block"
                    src="/mail2.png"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  />
                  <Image
                    className="bg-background aspect-15/8 relative rounded-2xl border border-border/25 dark:hidden"
                    src="/mail2-light.png"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  );
}
