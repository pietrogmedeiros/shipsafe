import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-border bg-surface/70 p-6 backdrop-blur">
      <h1 className="text-lg font-semibold tracking-tight text-ink">
        Entrar
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted">
        Acesse seu painel do ShipSafe.
      </p>
      <LoginForm />
      <p className="mt-5 text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-brand-soft hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
