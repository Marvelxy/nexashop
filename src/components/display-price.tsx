import { formatDisplayPrice } from "@/lib/currency-preference";

/**
 * Async server component for converted display prices.
 * Use inside JSX (including `.map()` callbacks) where `await` is illegal.
 */
export async function DisplayPrice({ value }: { value: number }) {
  return <>{await formatDisplayPrice(value)}</>;
}
