import Link from "next/link";

// Blocky's head — the SafeShip mascot, used as the app/nav mark.
export function BlockyMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="9.5" y="2.6" width="5" height="2.6" rx="1.2" fill="#f7d449" />
      <rect
        x="5.4"
        y="5"
        width="13.2"
        height="14"
        rx="3.6"
        fill="#f5c518"
        stroke="#c99a12"
        strokeWidth="0.8"
      />
      <circle cx="9.6" cy="11.4" r="1.35" fill="#141414" />
      <circle cx="14.4" cy="11.4" r="1.35" fill="#141414" />
      <path
        d="M9 14.4 Q12 17.1 15 14.4"
        stroke="#141414"
        strokeWidth="1.15"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShieldMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.3 7.5 10 4.4-1.7 7.5-5.4 7.5-10v-6L12 2.5Z"
        className="fill-brand/15 stroke-brand"
        strokeWidth="1.4"
      />
      <path
        d="m8.6 12 2.3 2.3 4.5-4.6"
        className="stroke-brand-soft"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-semibold tracking-tight text-ink ${className}`}
    >
      <BlockyMark className="h-6 w-6" />
      <span className="text-[15px]">
        Safe<span className="text-brand-soft">Ship</span>
      </span>
    </Link>
  );
}
