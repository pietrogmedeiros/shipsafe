import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUser } from "@/lib/repo";
import { effectivePlan } from "@/lib/plan";
import UpgradeClient from "./UpgradeClient";

// Server gate: must be logged in. If already Pro, show the "you're Pro" state
// with expiry; otherwise hand off to the client Pix flow.
export default async function UpgradePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUser(session.id);
  const base = user ?? { plan: session.plan, planUntil: session.planUntil };
  const isPro = effectivePlan(base) === "pro";

  if (isPro) {
    const until = base.planUntil
      ? new Date(base.planUntil).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;
    return (
      <main className="min-h-full flex items-center justify-center px-6 py-16 text-neutral-100">
        <div className="w-full max-w-md rounded-xl border border-emerald-500/30 bg-neutral-950/80 p-8 text-center shadow-2xl">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-2xl font-semibold text-emerald-400">
            Você já é Pro
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            Monitoramento contínuo, alertas a cada deploy, PDF e o selo{" "}
            <span className="text-emerald-400">Secured by ShipSafe</span> estão
            ativos.
          </p>
          {until && (
            <p className="mt-4 font-mono text-xs text-neutral-500">
              Pro válido até {until}
            </p>
          )}
          <a
            href="/app"
            className="mt-6 inline-block rounded-lg border border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
          >
            Voltar ao painel
          </a>
        </div>
      </main>
    );
  }

  return <UpgradeClient />;
}
