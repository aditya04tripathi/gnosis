import type { Metadata } from "next";
import { ABOUT, APP_INFO, METADATA } from "@/modules/shared/constants";

export const metadata: Metadata = METADATA.pages.about;

export default function AboutPage() {
  return (
    <div className="pt-24 flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2">About {APP_INFO.name}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Learn about our mission, vision, and the meaning behind our name
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3>
                What is <span className="text-primary">{APP_INFO.name}</span>?
              </h3>
              <p className="text-sm sm:text-base leading-relaxed">
                {ABOUT.gnosis.meaning}
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground italic">
                {ABOUT.gnosis.origin}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3>{ABOUT.vision.title}</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                {ABOUT.vision.content}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3>{ABOUT.mission.title}</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                {ABOUT.mission.content}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3>{ABOUT.why.title}</h3>
              <p className="text-sm sm:text-base leading-relaxed">
                {ABOUT.why.content}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
