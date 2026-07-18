import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createFeedback } from "@/lib/repo";

const schema = z.object({
  type: z.enum(["suggestion", "feature"]),
  message: z.string().min(3).max(2000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 400 });

  await createFeedback({
    userId: session.id,
    userEmail: session.email,
    userName: session.name,
    type: parsed.data.type,
    message: parsed.data.message,
  });
  return NextResponse.json({ ok: true });
}
