import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail } from "@/lib/repo";
import { createSession, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    // Same response for unknown email and wrong password (no user enumeration).
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await createSession(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      planUntil: user.planUntil,
    },
    parsed.data.rememberMe ?? true,
  );
  return NextResponse.json({ ok: true });
}
