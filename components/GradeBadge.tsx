import type { Grade } from "@/lib/types";
import { GRADE_STYLE } from "./severity";

const SIZES = {
  sm: "h-7 w-7 text-sm rounded-md",
  md: "h-10 w-10 text-lg rounded-lg",
  lg: "h-28 w-28 text-6xl rounded-2xl",
} as const;

export function GradeBadge({
  grade,
  size = "md",
  glow = false,
}: {
  grade: Grade | null;
  size?: keyof typeof SIZES;
  glow?: boolean;
}) {
  if (!grade) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold ring-1 ring-inset ring-white/10 bg-white/5 text-faint ${SIZES[size]}`}
      >
        –
      </span>
    );
  }
  const s = GRADE_STYLE[grade];
  return (
    <span
      className={`inline-flex items-center justify-center font-bold tracking-tight ring-1 ring-inset ${s.ring} ${s.bg} ${s.text} ${SIZES[size]} ${glow ? s.glow : ""}`}
    >
      {grade}
    </span>
  );
}
