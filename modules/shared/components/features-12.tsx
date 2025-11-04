"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/modules/shared/components/ui/accordion";
import { FEATURES } from "@/modules/shared/constants";

export default function Features() {
  const [activeItem, setActiveItem] = useState<number>(0);

  return (
    <section className="py-12 md:py-20 lg:py-32">
      <div className="bg-linear-to-b absolute inset-0 -z-10 sm:inset-6 sm:rounded-b-3xl dark:block dark:to-[color-mix(in_oklab,var(--color-muted)_75%,var(--color-background))]"></div>
      <div className="container mx-auto space-y-8 px-4 sm:px-6 md:space-y-16 lg:space-y-20 dark:[--color-border:color-mix(in_oklab,var(--color-foreground)_10%,transparent)]">
        <div className="relative z-10 mx-auto text-center">
          <h2>{FEATURES.heading}</h2>
          <p className="text-muted-foreground mt-2">{FEATURES.description}</p>
        </div>

        <div className="grid gap-8 sm:gap-12 sm:px-6 md:px-12 md:grid-cols-2 lg:gap-20 lg:px-0">
          <Accordion
            type="single"
            value={activeItem.toString()}
            onValueChange={(value) => setActiveItem(Number(value))}
            className="w-full"
          >
            {FEATURES.items.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <AccordionItem key={feature.title} value={index.toString()}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-base">
                      {IconComponent && <IconComponent className="size-4" />}
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
                  key={activeItem.toString()}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="size-full overflow-hidden rounded-2xl border bg-card shadow-md flex items-center justify-center p-12"
                >
                  {(() => {
                    const IconComponent = FEATURES.items[activeItem].icon;
                    return IconComponent ? (
                      <IconComponent className="p-10 size-20 md:size-64 text-muted-foreground dark:mix-blend-lighten" />
                    ) : null;
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
            {/* <BorderBeam
              duration={6}
              size={200}
              className="from-transparent via-yellow-700 to-transparent dark:via-white/50"
            /> */}
          </div>
        </div>
      </div>
    </section>
  );
}
