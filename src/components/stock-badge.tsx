export const LOW_STOCK_THRESHOLD = 5;

export function isOutOfStock(stock: number) {
  return stock < 1;
}

export function isLowStock(stock: number) {
  return stock >= 1 && stock <= LOW_STOCK_THRESHOLD;
}

export function StockBadge({ stock }: { stock: number }) {
  if (isOutOfStock(stock)) {
    return (
      <span className="inline-block rounded bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
        Out of stock
      </span>
    );
  }
  if (isLowStock(stock)) {
    return (
      <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      In stock
    </span>
  );
}
