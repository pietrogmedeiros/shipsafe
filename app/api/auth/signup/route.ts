import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/lib/repo";
import { createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
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
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await createUser(parsed.data);
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      planUntil: user.planUntil,
    });
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
