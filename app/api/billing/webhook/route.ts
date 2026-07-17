import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import {
  findPaymentByAbacateId,
  markPaymentPaid,
  grantProFor30Days,
} from "@/lib/repo";

// Production confirm path: AbacatePay → us. Verified two ways (either passes):
//  1) the `?webhookSecret=` query param equals our shared secret, OR
//  2) HMAC-SHA256(rawBody, secret) matches a signature header.
const SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET || "";
const SIG_HEADERS = [
  "x-abacatepay-signature",
  "x-abacate-signature",
  "x-webhook-signature",
  "x-signature",
];

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function verifySignature(rawBody: string, req: Request): boolean {
  if (!SECRET) return false;

  // (1) shared secret in the query string
  const qsSecret = new URL(req.url).searchParams.get("webhookSecret");
  if (qsSecret && safeEqual(qsSecret, SECRET)) return true;

  // (2) HMAC-SHA256 of the raw body, compared against any known signature header
  const expected = createHmac("sha256", SECRET).update(rawBody).digest("hex");
  for (const h of SIG_HEADERS) {
    const got = req.headers.get(h);
    if (!got) continue;
    // tolerate a "sha256=" prefix
    const norm = got.startsWith("sha256=") ? got.slice(7) : got;
    if (safeEqual(norm.toLowerCase(), expected)) return true;
  }
  return false;
}

// Dig the charge / transparent id out of whatever shape the payload arrives in.
function extractChargeId(payload: unknown): string | null {
  const p = payload as Record<string, unknown> | null;
  if (!p || typeof p !== "object") return null;
  const data = (p.data ?? p) as Record<string, unknown>;
  const candidates = [
    data.id,
    (data.charge as Record<string, unknown> | undefined)?.id,
    (data.transparent as Record<string, unknown> | undefined)?.id,
    (data.payment as Record<string, unknown> | undefined)?.id,
    (data.pixQrCode as Record<string, unknown> | undefined)?.id,
    p.id,
  ];
  for (const c of candidates) if (typeof c === "string" && c) return c;
  return null;
}

const PAID_EVENTS = new Set([
  "checkout.completed",
  "transparent.completed",
  "billing.paid",
]);

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req))
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const event =
    (payload as { event?: string; type?: string }).event ??
    (payload as { type?: string }).type ??
    "";

  if (!PAID_EVENTS.has(event)) {
    // Valid signature, but not an event we act on. Ack so retries stop.
    return NextResponse.json({ received: true });
  }

  const chargeId = extractChargeId(payload);
  if (chargeId) {
    const payment = await findPaymentByAbacateId(chargeId);
    // Idempotent: only act on the first paid transition.
    if (payment && payment.status !== "paid") {
      await markPaymentPaid(payment.id);
      await grantProFor30Days(payment.userId);
    }
  }

  return NextResponse.json({ received: true });
}
