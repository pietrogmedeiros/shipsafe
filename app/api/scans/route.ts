import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getUser } from "@/lib/repo";
import {
  countApps,
  createApp,
  getApp,
  listApps,
  listScans,
} from "@/lib/repo";
import { runScan } from "@/lib/scan-runner";
import { limitsFor } from "@/lib/plan";

const schema = z
  .object({
    url: z.string().min(3).optional(),
    name: z.string().max(80).optional(),
    appId: z.string().optional(),
  })
  .refine((d) => d.url || d.appId, { message: "url_or_appId_required" });

function normalizeUrl(raw: string): string | null {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 400 });

  // Rescan an existing app.
  if (parsed.data.appId) {
    const app = await getApp(parsed.data.appId);
    if (!app || app.userId !== session.id)
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    const scan = await runScan(app);
    return NextResponse.json({ ok: true, scan, appId: app.id });
  }

  // New app + first scan. Enforce the plan's app cap.
  const url = normalizeUrl(parsed.data.url!);
  if (!url) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const user = await getUser(session.id);
  const limits = limitsFor(user ?? { plan: "free", planUntil: null });
  const existing = await countApps(session.id);
  if (existing >= limits.maxApps) {
    return NextResponse.json(
      { error: "plan_limit", limit: limits.maxApps },
      { status: 402 },
    );
  }

  const name =
    parsed.data.name?.trim() || new URL(url).hostname.replace(/^www\./, "");
  const app = await createApp(session.id, { name, url });
  const scan = await runScan(app);
  return NextResponse.json({ ok: true, scan, appId: app.id });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("appId") ?? undefined;

  const [scans, apps] = await Promise.all([
    listScans(session.id, appId),
    listApps(session.id),
  ]);
  return NextResponse.json({ scans, apps });
}
