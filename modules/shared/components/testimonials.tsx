import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/modules/shared/components/ui/avatar";
import { Card, CardContent } from "@/modules/shared/components/ui/card";
import { APP_INFO, TESTIMONIALS } from "@/modules/shared/constants";

export default function Testimonials() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-4xl font-medium lg:text-5xl">
            {TESTIMONIALS.heading}
          </h2>
          <p className="text-muted-foreground">{TESTIMONIALS.description}</p>
        </div>

        <div className="grid gap-4 [--color-card:var(--color-muted)] *:border-none *:shadow-none sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
          <Card className="grid grid-rows-[1fr_auto] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2">
            <CardContent className="pt-6 flex flex-col">
              <blockquote className="flex flex-col h-full">
                <p className="text-xl font-medium grow mb-8">
                  {APP_INFO.name} transformed how I approach new ideas. The AI
                  feedback helped me identify critical weaknesses I hadn't seen,
                  and the project planning feature gave me a clear roadmap to
                  execute. It's like having a co-founder who's an expert in
                  every domain.
                </p>
              </blockquote>
            </CardContent>

            <CardContent className="pb-6 pt-0">
              <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage
                    src="https:
                    alt="Shekinah Tshiokufila"
                    height="400"
                    width="400"
                    loading="lazy"
                  />
                  <AvatarFallback>ST</AvatarFallback>
                </Avatar>

                <div>
                  <cite className="text-sm font-medium">Sarah Chen</cite>
                  <span className="text-muted-foreground block text-sm">
                    Founder, TechVenture
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-xl font-medium">
                  The validation insights were incredibly detailed. I used the
                  feedback to pivot my idea before spending months building
                  something that wouldn't work. Saved me time and money.
                </p>

                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage
                      src="https:
                      alt="Jonathan Yombo"
                      height="400"
                      width="400"
                      loading="lazy"
                    />
                    <AvatarFallback>JY</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="text-sm font-medium">
                      Marcus Rodriguez
                    </cite>
                    <span className="text-muted-foreground block text-sm">
                      Entrepreneur
                    </span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p>
                  The flowchart visualization helped my team understand the
                  project scope immediately. The SCRUM boards keep us organized
                  and moving forward efficiently.
                </p>

                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage
                      src="https:
                      alt="Yucel Faruksahan"
                      height="400"
                      width="400"
                      loading="lazy"
                    />
                    <AvatarFallback>YF</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="text-sm font-medium">Priya Sharma</cite>
                    <span className="text-muted-foreground block text-sm">
                      Product Manager
                    </span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
          <Card className="card variant-mixed">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p>
                  As a first-time founder, I didn't know where to start. The AI
                  validation and project planning features gave me confidence
                  and a clear path forward.
                </p>

                <div className="grid grid-cols-[auto_1fr] gap-3">
                  <Avatar className="size-12">
                    <AvatarImage
                      src="https:
                      alt="Rodrigo Aguilar"
                      height="400"
                      width="400"
                      loading="lazy"
                    />
                    <AvatarFallback>YF</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Alex Thompson</p>
                    <span className="text-muted-foreground block text-sm">
                      Startup Founder
                    </span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
