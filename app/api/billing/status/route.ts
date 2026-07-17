import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getPayment,
  markPaymentPaid,
  grantProFor30Days,
} from "@/lib/repo";
import { getChargeStatus } from "@/lib/abacate";

// Authoritative confirm path — the upgrade page polls this. Works even when
// the AbacatePay webhook can't reach localhost.
export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const paymentId = new URL(req.url).searchParams.get("paymentId");
  if (!paymentId)
    return NextResponse.json({ error: "missing_paymentId" }, { status: 400 });

  const payment = await getPayment(paymentId);
  if (!payment || payment.userId !== session.id)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (payment.status === "paid") {
    return NextResponse.json({ status: "paid" });
  }

  // Demo mode: confirm ~6s after creation so the UI shows pending → paid.
  if (payment.abacateId.startsWith("demo_")) {
    const age = Date.now() - new Date(payment.createdAt).getTime();
    if (age >= 6000) {
      await markPaymentPaid(payment.id);
      await grantProFor30Days(payment.userId);
      return NextResponse.json({ status: "paid" });
    }
    return NextResponse.json({ status: "pending" });
  }

  // Real mode: ask AbacatePay.
  const check = await getChargeStatus(payment.abacateId);
  if (check.status === "PAID") {
    await markPaymentPaid(payment.id);
    await grantProFor30Days(payment.userId);
    return NextResponse.json({ status: "paid" });
  }
  return NextResponse.json({ status: "pending" });
}
