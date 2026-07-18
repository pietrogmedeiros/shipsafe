import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full lg:grid lg:grid-cols-2">
      {/* Brand panel with a living Blocky — desktop only */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <Logo href="/" />
        </div>
        <div className="relative flex flex-col items-center gap-6">
          <Mascot mood="happy" size={240} />
          <div className="max-w-xs text-center">
            <p className="text-xl font-semibold text-ink">
              O Blocky está de olho.
            </p>
            <p className="mt-2 text-sm text-muted">
              Ele vigia seus deploys e avisa se o app começar a vazar — pra você
              shipar sem medo.
            </p>
          </div>
        </div>
        <p className="relative font-mono text-xs text-faint">safeship.space</p>
      </aside>

      {/* Form panel */}
      <main className="relative flex min-h-full items-center justify-center px-4 py-14">
        <div className="hero-glow pointer-events-none absolute inset-0 lg:hidden" />
        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo href="/" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
