import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo href="/" />
        </div>
        {children}
      </div>
    </div>
  );
}
