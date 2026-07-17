import Link from "next/link";

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
      <ShieldMark className="h-5 w-5" />
      <span className="text-[15px]">
        Ship<span className="text-brand-soft">Safe</span>
      </span>
    </Link>
  );
}
