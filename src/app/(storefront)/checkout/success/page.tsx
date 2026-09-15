export default function CheckoutSuccessPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold">Payment successful</h1>
      <p className="text-sm text-neutral-600">
        Stripe webhook will mark Order as PAID. See{" "}
        <code>src/app/api/webhooks/stripe/route.ts</code>.
      </p>
    </div>
  );
}
