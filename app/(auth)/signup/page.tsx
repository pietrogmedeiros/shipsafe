import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

// Next.js 16: `searchParams` is a Promise.
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.url) ? sp.url[0] : sp.url;
  const presetUrl = raw?.trim() || undefined;

  return (
    <div className="panel rounded-2xl p-6 backdrop-blur">
      <h1 className="text-lg font-semibold tracking-tight text-ink">
        Criar conta
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted">
        Grátis para 1 app. Sem cartão.
      </p>
      <SignupForm presetUrl={presetUrl} />
      <p className="mt-5 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand-soft hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
