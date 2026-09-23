import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  console.warn("STRIPE_SECRET_KEY missing - checkout will fail until set.");
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return (
    (key.startsWith("sk_test_") || key.startsWith("sk_live_")) &&
    !key.includes("X") &&
    !key.includes("placeholder") &&
    key.length > 20
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
});
