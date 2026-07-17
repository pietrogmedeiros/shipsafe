# ShipSafe — Team Contract (READ FIRST)

**Product:** Security scanner + continuous monitor for vibe-coded apps.
User pastes their deployed app URL → we hit it from the outside like an
attacker → find exposed secrets, Supabase RLS-off, exposed `.env`/`.git`,
missing security headers, leaked source maps → severity-ranked report with
plain-language fixes → grade A–F. Free = 1 app, on-demand. Pro = many apps,
continuous re-scan + alerts (Pix via AbacatePay, R$29/mo).

## Stack (do NOT change)
- **Next.js 16** (App Router, TS, Tailwind v4). Turbopack by default.
- **Elasticsearch** for ALL data (already on Contabo in prod; docker locally).
- **AbacatePay** (Pix) for billing.
- Auth = ES users + bcrypt + JWT httpOnly cookie (`lib/auth.ts`).

## ⚠️ Next.js 16 gotchas (breaking vs 14/15 — obey these)
- `cookies()`, `headers()`, `draftMode()` are **async** → `await cookies()`.
- `params` / `searchParams` in `page.tsx`, `layout.tsx`, `route.ts` are
  **Promises** → `const { id } = await params`.
- Route handler signature: `export async function GET(req: Request, ctx: { params: Promise<{ id: string }> })`.
- Middleware convention is now **`proxy.ts`** (not `middleware.ts`). Lead owns it.
- No `--turbopack` flag needed. `turbopack` config is top-level in next.config.ts.

## Shared contract (import, never redefine)
- Domain types: `@/lib/types` (User, App, Scan, Finding, RawFinding, Severity, Grade…).
- ES client: `@/lib/es` → `import { es } from "@/lib/es"`.
- Index names + bootstrap: `@/lib/indices` → `IDX.users|apps|scans|findings|payments`, `ensureIndices()`.
- Auth: `@/lib/auth` → `getSession()`, `createSession()`, `hashPassword()`, `verifyPassword()`.
- Plan gating: `@/lib/plan` → `effectivePlan()`, `limitsFor()`, `isPro()`, `PLAN_LIMITS`, `PRO_PRICE_CENTS`.
- AbacatePay: `@/lib/abacate` → `createPixCharge()`, `getChargeStatus()`.
- Money is always **BRL centavos** (int). Timestamps are **ISO strings**.

## File ownership — STAY IN YOUR LANE (avoids merge conflicts)
- **Lead (Claude):** all of `lib/*` except `lib/scanner/*`; `app/api/auth/*`;
  `app/api/scans/*`; `lib/scan-runner.ts`; `proxy.ts`; docker/deploy; layout + globals.
- **Scanner Engine (agent):** `lib/scanner/*` ONLY. Pure async fns, no ES/UI/Next.
- **Frontend/UX (agent):** `app/(marketing)/*`, `app/(app)/*`, `app/(auth)/*`,
  `components/*`. Never touch `lib/*` or `app/api/*`.
- **Billing (agent):** `app/api/billing/*`, `app/(app)/upgrade/*`. Uses `lib/abacate` + `lib/plan`.

## API seam (what Frontend calls, what Lead builds)
- `POST /api/auth/signup` `{name,email,password}` → sets cookie, 200.
- `POST /api/auth/login` `{email,password}` → sets cookie, 200.
- `POST /api/auth/logout` → clears cookie.
- `POST /api/scans` `{appId}` (or `{url}` to create app+scan) → runs scan, returns `Scan`.
- `GET /api/scans?appId=` → recent scans. `GET /api/scans/:id` → scan + findings.
- `POST /api/billing/upgrade` → `{ brCode, brCodeBase64, paymentId }` (Pix QR).
- `POST /api/billing/webhook` → AbacatePay confirms → flip user to pro 30d.
- `GET /api/billing/status?paymentId=` → `{ status }` for the upgrade page to poll.

Talk to teammates with `maestri ask "Name" "..."`. Run `maestri list` to see the team.
When your slice is done, `maestri ask "<lead codename>" "done: <what you built + how to run/verify>"`.
