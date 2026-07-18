import Link from "next/link";
import { Logo, ShieldMark } from "@/components/Logo";
import { HeroUrlForm } from "@/components/HeroUrlForm";
import { Mascot } from "@/components/Mascot";
import { LandingScanConsole } from "@/components/LandingScanConsole";

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
    label: "de chaves expostas em um único caso: o Moltbook",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Cole a URL",
    body: "Só o endereço do seu app publicado. Sem instalar SDK, sem conectar repositório, sem dar acesso ao código.",
  },
  {
    n: "2",
    title: "A gente sonda como um atacante",
    body: "Do lado de fora, batemos no app procurando segredos no bundle, Supabase sem RLS, .env e .git vazados, source maps e headers ausentes.",
  },
  {
    n: "3",
    title: "Você recebe a nota e o conserto",
    body: "Uma nota de A a F, a severidade de cada achado e o passo a passo pra corrigir — tudo em português claro.",
  },
];

const CHECKS = [
  {
    title: "Chaves e tokens de API no front-end",
    body: "Segredos que vazaram pro bundle e qualquer um lê abrindo o DevTools.",
  },
  {
    title: "Supabase / Postgres com RLS desligado",
    body: "Banco aberto: dá pra ler (e às vezes escrever) a tabela dos seus usuários.",
  },
  {
    title: "Arquivos .env, .git e backups acessíveis",
    body: "Configuração e histórico do projeto servidos publicamente sem querer.",
  },
  {
    title: "Source maps vazando o código-fonte",
    body: "Seu código original reconstruído a partir do que foi pro ar minificado.",
  },
  {
    title: "Endpoints administrativos abertos",
    body: "Rotas internas e de admin respondendo sem autenticação nenhuma.",
  },
  {
    title: "Headers de segurança ausentes",
    body: "CSP, HSTS e afins faltando — a porta encostada pra clickjacking e XSS.",
  },
];

const BLOCKY = [
  {
    mood: "happy" as const,
    tag: "Nota A / B",
    tagClass: "border-brand/40 bg-brand/10 text-brand-soft",
    title: "Tá seguro",
    body: "Blocky sorri: nenhum segredo exposto, banco fechado. Pode shipar tranquilo.",
  },
  {
    mood: "neutral" as const,
    tag: "Nota C",
    tagClass: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    title: "Atenção",
    body: "Nada crítico, mas tem ponto pra ajustar antes que vire problema.",
  },
  {
    mood: "angry" as const,
    tag: "Nota D–F",
    tagClass: "border-red-500/40 bg-red-500/10 text-red-300",
    title: "Vulnerabilidade crítica",
    body: "Blocky fica bravo e solta fumacinha: tem coisa exposta agora. Corrija hoje.",
  },
];

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-full flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
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
              className="rounded-md bg-brand px-3.5 py-1.5 text-sm font-semibold text-black transition hover:bg-brand-soft"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:pb-28">
          {/* copy */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ss-pulse" />
              Scanner de segurança pra apps vibe-coded
            </span>

            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl">
              Você shipou numa tarde.
              <br />
              O{" "}
              <span className="relative whitespace-nowrap text-brand">
                vazamento
                <span className="absolute inset-x-0 -bottom-1 h-2 rounded-full bg-brand/20" />
              </span>{" "}
              foi junto.
            </h1>

            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-muted sm:text-lg">
              Chave de API no bundle, Supabase sem RLS,{" "}
              <span className="font-mono text-faint">.env</span> exposto. O
              SafeShip bate no seu app publicado como um atacante de verdade e
              acha isso{" "}
              <span className="text-ink">
                antes que alguém mal-intencionado ache primeiro
              </span>
              .
            </p>

            <div className="mt-8">
              <HeroUrlForm />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-faint">
              <span className="inline-flex items-center gap-1.5">
                <ShieldMark className="h-4 w-4" /> Grátis pra 1 app
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldMark className="h-4 w-4" /> Sem cartão
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldMark className="h-4 w-4" /> Resultado em segundos
              </span>
            </div>
          </div>

          {/* live scan console */}
          <div className="flex justify-center lg:justify-end">
            <LandingScanConsole />
          </div>
        </div>
      </section>

      {/* Social proof / alarm */}
      <section className="relative border-b border-border bg-bg-elev">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-red-300">
              incidentes reais · 2026
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.value} className="bg-surface px-6 py-8">
                <div className="text-4xl font-bold tracking-tight text-brand-soft sm:text-5xl">
                  {s.value}
                </div>
                <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-muted">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-faint">
            Dados de incidentes reais de apps vibe-coded em 2026. Não é FUD — é o
            que já está indexado e exposto agora.
          </p>
        </div>
      </section>

      {/* Conheça o Blocky */}
      <section className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-wide text-brand-soft">
            O mascote
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Conheça o Blocky
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Blocky é seu guarda de bloquinhos. Ele reage ao resultado do scan —
            sorri quando está tudo seguro e fica bravo, soltando fumacinha,
            quando acha algo crítico. É a forma mais rápida de transformar um
            relatório técnico em algo que você entende num olhar.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {BLOCKY.map((b) => (
            <div
              key={b.mood}
              className="flex flex-col items-center rounded-2xl border border-border bg-surface px-6 py-8 text-center"
            >
              <div className="grid h-40 place-items-center">
                <Mascot mood={b.mood} size={132} />
              </div>
              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${b.tagClass}`}
              >
                {b.tag}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="relative border-y border-border bg-bg-elev">
        <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-wide text-brand-soft">
              Como funciona
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Do deploy à nota em três passos
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Zero configuração. Você não conecta repositório, não instala SDK e
              não dá acesso ao código — a gente trabalha só com a URL pública.
            </p>
          </div>

          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.n}
                className="relative flex flex-col rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-brand/30 bg-brand/10 font-mono text-sm font-bold text-brand-soft">
                    {step.n}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="hidden flex-1 border-t border-dashed border-border md:block"
                    />
                  )}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* O que verificamos */}
      <section className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[11px] uppercase tracking-wide text-brand-soft">
              A superfície de ataque
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              O que verificamos
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Os furos mais comuns — e mais caros — de um app publicado às
              pressas. A gente checa cada um do jeito que um atacante checaria.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <li
                key={c.title}
                className="rounded-xl border border-border bg-surface p-5 transition hover:border-brand/30"
              >
                <div className="flex items-start gap-3">
                  <ShieldMark className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {c.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {c.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Como nasceu o SafeShip — editorial */}
      <section className="relative overflow-hidden border-y border-border bg-bg-elev">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-brand-soft">
            A origem
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Como nasceu o SafeShip
          </h2>

          <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted">
            <p>
              A febre do vibe coding botou milhares de apps no ar em horas — e
              junto foram embora chaves de API no bundle, Supabase sem RLS,{" "}
              <span className="font-mono text-base text-faint">.env</span>{" "}
              exposto. Um levantamento achou que{" "}
              <span className="text-ink">
                11% dos apps indie vazavam credenciais do Supabase
              </span>
              ; o caso Moltbook expôs 1,5 milhão de chaves.
            </p>

            <figure className="my-10 border-l-2 border-brand pl-6">
              <blockquote className="text-balance text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl">
                “A mesma IA que escreveu o vazamento não enxerga o vazamento.”
              </blockquote>
              <figcaption className="mt-3 font-mono text-xs text-faint">
                — o ponto cego que ninguém tava olhando
              </figcaption>
            </figure>

            <p>
              Pedir “revise a segurança” não resolve, porque o ponto cego é o
              mesmo. Faltava um olhar de fora, independente, que batesse no app
              publicado como um atacante de verdade.
            </p>
            <p>
              Foi disso que nasceu o SafeShip: um raio-x externo, em português,
              que qualquer um roda colando uma URL — sem instalar SDK, sem dar
              acesso ao código. E porque segurança dá medo e ninguém curte ler
              relatório técnico, veio o Blocky pra traduzir tudo num olhar.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-wide text-brand-soft">
            Planos
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Preço honesto
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            O relatório completo é grátis. Você só paga quando quer continuar
            protegido a cada deploy.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-5 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-border bg-surface p-7">
            <h3 className="text-sm font-medium text-muted">Free</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-ink">
                R$ 0
              </span>
              <span className="text-sm text-faint">/ sempre</span>
            </div>
            <p className="mt-2 text-sm text-muted">Pro seu primeiro raio-x.</p>
            <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-ink">
              <Feature>1 app</Feature>
              <Feature>Scan sob demanda</Feature>
              <Feature>Relatório completo</Feature>
              <Feature>Nota de A a F com as correções</Feature>
            </ul>
            <Link
              href="/signup"
              className="mt-7 rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-ink transition hover:border-white/20 hover:bg-white/5"
            >
              Começar grátis
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-2xl border border-brand/50 bg-surface p-7 shadow-[0_0_80px_-30px_rgba(245,197,24,0.55)]">
            <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-black">
              Recomendado
            </span>
            <h3 className="text-sm font-medium text-brand-soft">Pro</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-ink">
                R$ 29
              </span>
              <span className="text-sm text-faint">/ano</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Proteção contínua conforme você faz deploy.
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-ink">
              <Feature pro>Até 25 apps</Feature>
              <Feature pro>Monitoramento contínuo</Feature>
              <Feature pro>Alerta a cada novo deploy</Feature>
              <Feature pro>Exportar relatório em PDF</Feature>
              <Feature pro>Selo “Secured by SafeShip”</Feature>
            </ul>
            <Link
              href="/signup"
              className="mt-7 rounded-lg bg-brand py-2.5 text-center text-sm font-semibold text-black transition hover:bg-brand-soft"
            >
              Assinar o Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-border bg-bg-elev">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <div className="mb-2">
            <Mascot mood="happy" size={96} />
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            Descubra o que está exposto.
          </h2>
          <p className="mt-4 max-w-md text-base text-muted">
            Leva menos tempo do que você levou pra fazer deploy. Cole a URL e
            veja a nota do seu app agora.
          </p>
          <div className="mt-8 flex w-full max-w-xl justify-center">
            <HeroUrlForm />
          </div>
          <p className="mt-3 font-mono text-xs text-faint">
            grátis · sem cartão · sem acesso ao código
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-faint sm:flex-row sm:px-6">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Logo href="/" />
            <p className="text-xs">
              © {year} SafeShip · Feito pra quem shipa rápido.
            </p>
          </div>
          <a
            href="https://safeship.space"
            className="font-mono text-xs text-muted transition hover:text-brand-soft"
          >
            safeship.space
          </a>
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
