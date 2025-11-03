"use client";
import { Brain, GitBranch, LayoutGrid, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { FEATURES } from "@/modules/shared/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/modules/shared/components/ui/accordion";
import { BorderBeam } from "./ui/border-beam";

const iconMap = {
  Brain,
  GitBranch,
  LayoutGrid,
  Sparkles,
};

export default function Features() {
  type ImageKey = "item-1" | "item-2" | "item-3" | "item-4";
  const [activeItem, setActiveItem] = useState<ImageKey>("item-1");

  const images = {
    "item-1": {
      image: "/mail2.png",
      alt: "AI-powered validation dashboard",
    },
    "item-2": {
      image: "/mail2.png",
      alt: "Interactive flowchart visualization",
    },
    "item-3": {
      image: "/mail2.png",
      alt: "SCRUM task management board",
    },
    "item-4": {
      image: "/mail2.png",
      alt: "Project planning interface",
    },
  };

  return (
    <section className="py-12 md:py-20 lg:py-32">
      <div className="bg-linear-to-b absolute inset-0 -z-10 sm:inset-6 sm:rounded-b-3xl dark:block dark:to-[color-mix(in_oklab,var(--color-muted)_75%,var(--color-background))]"></div>
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16 lg:space-y-20 dark:[--color-border:color-mix(in_oklab,var(--color-foreground)_10%,transparent)]">
        <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-6xl">
            {FEATURES.heading}
          </h2>
          <p className="text-muted-foreground">{FEATURES.description}</p>
        </div>

        <div className="grid gap-12 sm:px-12 md:grid-cols-2 lg:gap-20 lg:px-0">
          <Accordion
            type="single"
            value={activeItem}
            onValueChange={(value) => setActiveItem(value as ImageKey)}
            className="w-full"
          >
            {FEATURES.items.map((feature, index) => {
              const Icon = iconMap[feature.icon as keyof typeof iconMap];
              return (
                <AccordionItem key={feature.title} value={`item-${index + 1}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-base">
                      {Icon && <Icon className="size-4" />}
                      {feature.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>{feature.description}</AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <div className="bg-background relative flex overflow-hidden rounded-3xl border p-2">
            <div className="w-15 absolute inset-0 right-0 ml-auto border-l bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_8px)]"></div>
            <div className="aspect-76/59 bg-background relative w-[calc(3/4*100%+3rem)] rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeItem}-id`}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="size-full overflow-hidden rounded-2xl border bg-card shadow-md"
                >
                  <Image
                    src={images[activeItem].image}
                    className="size-full object-cover object-top-left dark:mix-blend-lighten"
                    alt={images[activeItem].alt}
                    width={1207}
                    height={929}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <BorderBeam
              duration={6}
              size={200}
              className="from-transparent via-yellow-700 to-transparent dark:via-white/50"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
