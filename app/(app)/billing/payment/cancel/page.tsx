import { XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PaymentCancelPage() {
  return (
    <div className="flex h-full flex-col">
      <main className="flex flex-1 items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Payment Cancelled
            </CardTitle>
            <CardDescription>
              Your payment was cancelled. No charges were made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/pricing">Back to Pricing</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
