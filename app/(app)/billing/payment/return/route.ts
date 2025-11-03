import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { capturePayment } from "@/modules/payment/actions/payment";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const subscriptionId =
    searchParams.get("subscription_id") || searchParams.get("token");

  if (!subscriptionId) {
    redirect("/billing/payment/error?error=Missing subscription ID");
  }

  const result = await capturePayment(subscriptionId);

  if (result.error || !result.success) {
    redirect(
      `/billing/payment/error?error=${encodeURIComponent(
        result.error || "Subscription activation failed",
      )}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/pricing");
  revalidatePath("/billing");

  redirect("/dashboard?payment=success");
}
