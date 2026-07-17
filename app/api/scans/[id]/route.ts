import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getScan, listFindings } from "@/lib/repo";

// Next.js 16: route handler `params` is a Promise.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const scan = await getScan(id);
  if (!scan || scan.userId !== session.id)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const findings = await listFindings(id);
  return NextResponse.json({ scan, findings });
}
