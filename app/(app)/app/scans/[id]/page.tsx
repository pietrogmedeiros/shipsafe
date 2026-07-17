import Link from "next/link";
import { getSession } from "@/lib/auth";
import { effectivePlan } from "@/lib/plan";
import { ScanReport } from "@/components/ScanReport";

// Next.js 16: `params` is a Promise.
export default async function ScanReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const pro = session ? effectivePlan(session) === "pro" : false;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted transition hover:text-ink"
      >
        ← Painel
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Relatório de segurança
        </h1>
        <p className="mt-1 text-sm text-muted">
          O que um atacante consegue ver do seu app a partir da internet.
        </p>
      </div>
      <ScanReport id={id} isPro={pro} />
    </div>
  );
}
