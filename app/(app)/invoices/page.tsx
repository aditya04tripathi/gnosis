import { Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import { getInvoices } from "@/actions/payment";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Invoices",
  description: "View and download your invoices",
};

export default async function InvoicesPage() {
  const session = await auth();

  // Fetch invoices from PayPal
  const invoicesResult = session?.user
    ? await getInvoices()
    : { success: false as const, error: "Unauthorized" };

  const invoices =
    invoicesResult.success && invoicesResult.data
      ? invoicesResult.data.invoices
      : [];

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1">
        <div className="container mx-auto flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
              <p className="text-muted-foreground">
                View and download your payment invoices
              </p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Invoices</CardTitle>
                <CardDescription>
                  Your invoices will appear here once you make a payment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No invoices available yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map(
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
                  invoiceUrl?: string;
                }) => (
                  <Card key={invoice.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {invoice.invoiceNumber && (
                              <span className="text-muted-foreground font-normal text-sm mr-2">
                                {invoice.invoiceNumber}
                              </span>
                            )}
                            {invoice.description}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(invoice.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}{" "}
                            • ${invoice.amount.toFixed(2)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={`/api/invoices/${invoice.id}/download`}
                              download
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ),
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
