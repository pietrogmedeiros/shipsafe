import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUser } from "@/lib/repo";
import { effectivePlan, limitsFor } from "@/lib/plan";

// Current session + effective plan + limits, for client components.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 200 });

  const user = await getUser(session.id);
  const base = user ?? { plan: session.plan, planUntil: session.planUntil };
  return NextResponse.json({
    user: {
      id: session.id,
      name: session.name,
      email: session.email,
      plan: effectivePlan(base),
      planUntil: base.planUntil,
    },
    limits: limitsFor(base),
  });
}
