export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  tier: "MONTHLY" | "YEARLY";
  status: "pending" | "completed" | "failed";
  paypalOrderId?: string;
  createdAt: Date;
}

export interface Subscription {
  userId: string;
  tier: "MONTHLY" | "YEARLY";
  status: "active" | "cancelled" | "expired";
  startDate: Date;
  endDate?: Date;
  paypalSubscriptionId?: string;
}
