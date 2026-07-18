import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";
import { getUser, createPayment, grantProForOneYear } from "@/lib/repo";
import { createPixCharge, isConfigured } from "@/lib/abacate";
import { PRO_PRICE_CENTS, effectivePlan } from "@/lib/plan";
import { findCoupon, priceWithCoupon } from "@/lib/coupons";

// A believable Pix "copia e cola" (EMV BR Code) placeholder for the demo
// path, so the whole upgrade UX is exercisable with no AbacatePay key.
const DEMO_BRCODE =
  "00020126580014br.gov.bcb.pix0136demo-shipsafe-pro-00000000-0000-000052040000" +
  "5303986540529.005802BR5910SafeShip LP6009SAO PAULO62070503***6304DEMO";

// A tiny, self-contained SVG "QR" placeholder as a data URI. Not a scannable
// code — it just fills the <img src={brCodeBase64}> slot in demo mode.
function demoQrDataUri(): string {
  const cell = 8;
  const n = 21;
  const rects: string[] = [];
  // deterministic pseudo-random modules + the three finder squares
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (border || core)
          rects.push(
            `<rect x="${(ox + x) * cell}" y="${(oy + y) * cell}" width="${cell}" height="${cell}"/>`,
          );
      }
    }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
  let seed = 1337;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (inFinder) continue;
      if (rnd() > 0.55)
        rects.push(
          `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`,
        );
    }
  }
  const size = n * cell;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
    `<g fill="#0a0a0a">${rects.join("")}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await getUser(session.id);
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (effectivePlan(user) === "pro") {
    return NextResponse.json({ alreadyPro: true });
  }

  // Optional discount coupon.
  let couponCode: string | undefined;
  try {
    const body = (await req.json()) as { coupon?: string };
    couponCode = body?.coupon;
  } catch {
    /* no body → no coupon */
  }
  const coupon = findCoupon(couponCode);
  if (couponCode && couponCode.trim() && !coupon) {
    return NextResponse.json({ error: "invalid_coupon" }, { status: 400 });
  }
  const amount = priceWithCoupon(PRO_PRICE_CENTS, coupon);
  const couponInfo = coupon
    ? { code: coupon.code, label: coupon.label }
    : null;

  // Coupon zeroed the price → grant Pro directly, no Pix needed.
  if (amount <= 0) {
    await grantProForOneYear(user.id);
    return NextResponse.json({ freeUpgrade: true, coupon: couponInfo, amount: 0 });
  }

  const description = `SafeShip Pro — 1 ano${coupon ? ` (cupom ${coupon.code})` : ""}`;

  // Real mode: create a Pix charge via AbacatePay. Always return JSON — never
  // let an AbacatePay error bubble into an empty 500 body (the client does
  // res.json() and would throw "Unexpected end of JSON input").
  if (isConfigured()) {
    try {
      const charge = await createPixCharge({ amount, description, expiresIn: 3600 });
      const payment = await createPayment({
        userId: user.id,
        abacateId: charge.id,
        amount,
      });
      return NextResponse.json({
        paymentId: payment.id,
        brCode: charge.brCode,
        brCodeBase64: charge.brCodeBase64,
        demo: false,
        amount,
        coupon: couponInfo,
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { error: "Não foi possível gerar o Pix. Tente novamente.", detail },
        { status: 502 },
      );
    }
  }

  // Demo fallback: synthesize a charge so the flow works with no key.
  const abacateId = `demo_${randomUUID()}`;
  const payment = await createPayment({
    userId: user.id,
    abacateId,
    amount,
  });
  return NextResponse.json({
    paymentId: payment.id,
    brCode: DEMO_BRCODE,
    brCodeBase64: demoQrDataUri(),
    demo: true,
    amount,
    coupon: couponInfo,
  });
}
