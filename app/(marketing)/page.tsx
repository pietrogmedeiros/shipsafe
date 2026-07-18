import Link from "next/link";
import { Logo, ShieldMark } from "@/components/Logo";
import { HeroUrlForm } from "@/components/HeroUrlForm";

const STATS = [
  {
    value: "11%",
    label: "dos apps vibe-coded vazam credenciais do Supabase",
  },
  {
    value: "380 mil",
    label: "apps encontrados vazando dados de usuários",
  },
  {
    value: "1,5 mi",
    label: "chaves expostas em um único caso (Moltbook)",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Cole a URL",
    body: "Informe o endereço do seu app publicado. Não precisa instalar nada nem dar acesso ao código.",
  },
  {
    n: "02",
    title: "A gente sonda como um atacante",
    body: "Do lado de fora, procuramos segredos expostos, Supabase sem RLS, .env e .git vazados, source maps e headers ausentes.",
  },
  {
    n: "03",
    title: "Você recebe a nota e o conserto",
    body: "Relatório com nota A–F, severidade de cada achado e o passo a passo para corrigir — em português claro.",
  },
];

const CHECKS = [
  "Chaves e tokens de API expostos no front-end",
  "Supabase / Postgres com RLS desligado",
  "Arquivos .env, .git e backups acessíveis",
  "Source maps vazando seu código-fonte",
  "Endpoints administrativos abertos",
  "Headers de segurança ausentes",
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-full flex-col">
      {/* Nav */}
      <header className="relative z-10 mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-muted transition hover:text-ink"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-white/5 px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-inset ring-white/10 transition hover:bg-white/10"
          >
            Criar conta
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 pb-16 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ss-pulse" />
            Scanner de segurança para apps vibe-coded
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
            Seu app vibe-coded
            <br />
            está{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
              vazando
            </span>
            ?
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            Escaneamos seu app publicado do jeito que um hacker faria — de fora,
            sem acesso ao código — para achar segredos expostos, Supabase sem
            RLS e arquivos <span className="font-mono text-faint">.env</span>{" "}
            vazados <span className="text-ink">antes que alguém mal-intencionado ache</span>.
          </p>

          <div className="mt-8 flex w-full justify-center">
            <HeroUrlForm />
          </div>
          <p className="mt-3 text-xs text-faint">
            Grátis para 1 app. Sem cartão. Resultado em segundos.
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="relative border-y border-border bg-bg-elev">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 divide-y divide-border px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
          {STATS.map((s) => (
            <div key={s.value} className="px-2 py-8 text-center sm:px-6">
              <div className="text-3xl font-bold tracking-tight text-brand-soft sm:text-4xl">
                {s.value}
              </div>
              <p className="mx-auto mt-2 max-w-[16rem] text-sm text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <p className="pb-6 text-center text-xs text-faint">
          Dados de incidentes reais de apps vibe-coded em 2026.
        </p>
      </section>

      {/* Como funciona */}
      <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Como funciona
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Três passos, zero configuração. Você não conecta repositório nem
            instala SDK.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="font-mono text-sm text-brand-soft">{step.n}</div>
              <h3 className="mt-3 text-base font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        {/* What we check */}
        <div className="mt-6 rounded-2xl border border-border bg-bg-elev p-6 sm:p-8">
          <h3 className="text-sm font-medium text-muted">O que verificamos</h3>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-start gap-2.5 text-sm text-ink">
                <ShieldMark className="mt-0.5 h-4 w-4 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Preço honesto
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            O relatório completo é grátis. Você paga quando quer continuar
            protegido a cada deploy.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-medium text-muted">Free</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink">R$ 0</span>
            </div>
            <p className="mt-1 text-sm text-muted">Para o primeiro raio-x.</p>
            <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm text-ink">
              <Feature>1 app</Feature>
              <Feature>Scan sob demanda</Feature>
              <Feature>Relatório completo</Feature>
              <Feature>Nota de A a F com correções</Feature>
            </ul>
            <Link
              href="/signup"
              className="mt-6 rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-ink transition hover:border-white/20 hover:bg-white/5"
            >
              Começar grátis
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-2xl border border-brand/40 bg-surface p-6 shadow-[0_0_60px_-24px_rgba(245,197,24,0.5)]">
            <span className="absolute -top-2.5 right-5 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-black">
              Recomendado
            </span>
            <h3 className="text-sm font-medium text-brand-soft">Pro</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-ink">R$ 29</span>
              <span className="text-sm text-faint">/mês</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Proteção contínua conforme você faz deploy.
            </p>
            <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm text-ink">
              <Feature pro>Até 25 apps</Feature>
              <Feature pro>Monitoramento contínuo</Feature>
              <Feature pro>Alerta a cada novo deploy</Feature>
              <Feature pro>Exportar relatório em PDF</Feature>
              <Feature pro>Selo “Secured by SafeShip”</Feature>
            </ul>
            <Link
              href="/signup"
              className="mt-6 rounded-lg bg-brand py-2.5 text-center text-sm font-semibold text-black transition hover:bg-brand-soft"
            >
              Assinar o Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Descubra o que está exposto.
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted">
            Leva menos tempo do que você levou pra fazer deploy. Cole a URL e
            veja sua nota agora.
          </p>
          <div className="mt-8 w-full max-w-xl">
            <HeroUrlForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-faint sm:flex-row sm:px-6">
          <Logo href="/" />
          <p>© {new Date().getFullYear()} SafeShip. Feito para quem shipa rápido.</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  children,
  pro = false,
}: {
  children: React.ReactNode;
  pro?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        viewBox="0 0 20 20"
        className={`mt-0.5 h-4 w-4 shrink-0 ${pro ? "text-brand-soft" : "text-muted"}`}
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{children}</span>
    </li>
  );
}
