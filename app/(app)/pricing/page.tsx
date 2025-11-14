import type { Metadata } from "next";
import { APP_INFO, METADATA, SUBSCRIPTION_PLANS } from "@/modules/shared/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/modules/shared/components/ui/card";

export const metadata: Metadata = {
  ...METADATA.default,
  title: `Pricing | ${APP_INFO.name}`,
  description: "Free plan available for startup validation",
  openGraph: {
    ...METADATA.default.openGraph,
    title: `Pricing | ${APP_INFO.name}`,
    description: "Free plan available for startup validation",
  },
};

export default function PricingPage() {
  const plan = SUBSCRIPTION_PLANS.FREE;

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8 py-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1>Pricing</h1>
              <p className="text-muted-foreground">
                Simple, transparent pricing for everyone
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>{plan.name} Plan</CardTitle>
                <CardDescription>
                  Perfect for getting started with startup validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">Free</div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
