import { ArrowRight, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getInvoices } from "@/actions/payment";
import { auth } from "@/auth";
import { BillingSettings } from "@/components/billing-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import connectDB from "@/lib/db";
import User from "@/models/User";

export const metadata: Metadata = {
  title: "Billing Settings",
  description: "Manage your subscription and billing",
};

export default async function BillingPage() {
  const session = await auth();
  await connectDB();
  const user = await User.findById(session?.user?.id).lean();

  if (!user) {
    return null;
  }

  // Fetch top 2 invoices
  const invoicesResult = session?.user
    ? await getInvoices()
    : { success: false as const, error: "Unauthorized" };

  const allInvoices =
    invoicesResult.success && invoicesResult.data
      ? invoicesResult.data.invoices
      : [];
  const topInvoices = allInvoices.slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
              <p className="text-muted-foreground">
                Manage your subscription and billing
              </p>
            </div>
          </div>

          <BillingSettings
            user={{
              subscriptionTier: user.subscriptionTier,
              paypalSubscriptionId: user.paypalSubscriptionId,
            }}
          />

          {/* Recent Invoices */}
          {topInvoices.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Invoices</CardTitle>
                    <CardDescription>
                      Your latest payment invoices
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/invoices">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topInvoices.map(
                    (invoice: {
                      id: string;
                      invoiceNumber?: string;
                      date: string;
                      amount: number;
                      status:
                        | "paid"
                        | "pending"
                        | "failed"
                        | "cancelled"
                        | "refunded";
                      description: string;
                    }) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {invoice.invoiceNumber && (
                                <span className="text-muted-foreground mr-2 text-sm font-normal">
                                  {invoice.invoiceNumber}
                                </span>
                              )}
                              {invoice.description}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(invoice.date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}{" "}
                              • ${invoice.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-primary/10 text-primary"
                              : invoice.status === "pending"
                                ? "bg-accent/50 text-accent-foreground"
                                : invoice.status === "cancelled"
                                  ? "bg-muted text-muted-foreground"
                                  : invoice.status === "refunded"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
