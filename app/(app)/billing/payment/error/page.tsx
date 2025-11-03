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

export default async function PaymentErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="flex h-full flex-col">
      <main className="flex flex-1 items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Payment Failed
            </CardTitle>
            <CardDescription>
              {error || "Failed to process payment"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/pricing">Back to Pricing</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
