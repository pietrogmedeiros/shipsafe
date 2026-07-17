"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-lg border border-border bg-surface py-2.5 px-3 text-sm text-ink placeholder:text-faint outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20";

export function SignupForm({ presetUrl }: { presetUrl?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "scanning">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 || data.error === "email_taken") {
          setError("Este e-mail já tem conta. Faça login.");
        } else if (data.error === "validation") {
          setError("Verifique os dados: senha precisa de ao menos 8 caracteres.");
        } else {
          setError("Não foi possível criar a conta. Tente novamente.");
        }
        setBusy(false);
        return;
      }

      // Account created + session cookie set. Auto-scan if a URL was carried in.
      if (presetUrl) {
        setPhase("scanning");
        try {
          const scanRes = await fetch("/api/scans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: presetUrl }),
          });
          if (scanRes.ok) {
            const data = await scanRes.json();
            if (data?.scan?.id) {
              router.push(`/app/scans/${data.scan.id}`);
              return;
            }
          }
        } catch {
          /* fall through to dashboard */
        }
      }

      router.push("/app");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setBusy(false);
    }
  }

  if (phase === "scanning") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="h-8 w-8 rounded-full border-2 border-brand/30 border-t-brand animate-ss-spin" />
        <div>
          <p className="text-sm font-medium text-ink">Escaneando seu app…</p>
          <p className="mt-1 font-mono text-xs text-faint break-all">
            {presetUrl}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {presetUrl && (
        <div className="rounded-lg border border-brand/25 bg-brand/8 px-3 py-2 text-xs text-brand-soft">
          Vamos escanear{" "}
          <span className="font-mono break-all text-emerald-200">
            {presetUrl}
          </span>{" "}
          assim que sua conta estiver pronta.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Nome</span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          autoComplete="name"
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@empresa.com"
          autoComplete="email"
          className={inputCls}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Senha</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mínimo 8 caracteres"
          autoComplete="new-password"
          className={inputCls}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="mt-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-soft disabled:opacity-60"
      >
        {busy ? "Criando conta…" : "Criar conta grátis"}
      </button>
    </form>
  );
}
