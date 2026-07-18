// Discount coupons for the Pro upgrade. Add/adjust codes here — it's the
// single source of truth. `percentOff` (0–100) and/or `amountOffCents` stack;
// the final price is floored at 0 (a 100%-off coupon grants Pro with no Pix).

export interface Coupon {
  code: string;
  percentOff?: number;
  amountOffCents?: number;
  label: string; // shown to the user when applied
}

const COUPONS: Record<string, Coupon> = {
  BIIP: { code: "BIIP", percentOff: 50, label: "Cupom BIIP — 50% off" },
};

export function findCoupon(input: string | null | undefined): Coupon | null {
  if (!input) return null;
  return COUPONS[input.trim().toUpperCase()] ?? null;
}

// Apply a coupon to a base price (in centavos). Never returns below 0.
export function priceWithCoupon(
  baseCents: number,
  coupon: Coupon | null,
): number {
  if (!coupon) return baseCents;
  let cents = baseCents;
  if (coupon.percentOff) {
    cents = Math.round(cents * (1 - coupon.percentOff / 100));
  }
  if (coupon.amountOffCents) {
    cents -= coupon.amountOffCents;
  }
  return Math.max(0, cents);
}
