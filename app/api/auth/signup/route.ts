import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/lib/repo";
import { createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { isDisposableEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

// Per-IP signup cap: 5 accounts per hour from one address. Bots that flood
// the endpoint get 429'd; a real person creating an account never hits it.
const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`signup:${ip}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

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

  if (isDisposableEmail(parsed.data.email)) {
    return NextResponse.json({ error: "email_not_allowed" }, { status: 400 });
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
