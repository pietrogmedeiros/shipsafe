import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { effectivePlan } from "@/lib/plan";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const pro = effectivePlan(session) === "pro";

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/app" />
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                pro
                  ? "bg-amber-500/12 text-amber-300 ring-amber-500/30"
                  : "bg-white/5 text-muted ring-white/10"
              }`}
            >
              {pro ? "Pro" : "Free"}
            </span>
            {!pro && (
              <Link
                href="/app/upgrade"
                className="hidden rounded-md px-2.5 py-1.5 text-sm text-brand-soft transition hover:bg-white/5 sm:inline"
              >
                Upgrade
              </Link>
            )}
            <span className="hidden text-sm text-muted sm:inline">
              {session.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
