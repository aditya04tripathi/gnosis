import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { capturePayment } from "@/actions/payment";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // PayPal returns subscription_id in the URL automatically
  const subscriptionId =
    searchParams.get("subscription_id") || searchParams.get("token");

  if (!subscriptionId) {
    redirect("/billing/payment/error?error=Missing subscription ID");
  }

  // Activate the subscription (tier and plan will be retrieved from Redis cache or PayPal API)
  const result = await capturePayment(subscriptionId);

  if (result.error || !result.success) {
    redirect(
      `/billing/payment/error?error=${encodeURIComponent(
        result.error || "Subscription activation failed",
      )}`,
    );
  }

  // Revalidate paths after successful subscription activation (outside of render)
  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  revalidatePath("/billing");

  // Redirect to dashboard with success message
  redirect("/dashboard?payment=success");
}
