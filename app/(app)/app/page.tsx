import { getSession } from "@/lib/auth";
import { effectivePlan } from "@/lib/plan";
import { Dashboard } from "@/components/Dashboard";

export default async function DashboardPage() {
  const session = await getSession();
  // Layout already gates; this is a safe fallback for typing.
  const pro = session ? effectivePlan(session) === "pro" : false;
  const firstName = session?.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {firstName ? `Olá, ${firstName}` : "Painel"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Escaneie seus apps publicados e veja o que está exposto para a
          internet.
        </p>
      </div>
      <Dashboard isPro={pro} />
    </div>
  );
}
