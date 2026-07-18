import type { Grade } from "@/lib/types";

export type Mood = "happy" | "angry" | "neutral";

// Blocky reacts to the scan: happy when the app is safe, angry when it isn't.
export function moodForScan(
  grade: Grade | null,
  criticalCount: number,
): Mood {
  if (criticalCount > 0 || grade === "F" || grade === "D") return "angry";
  if (grade === "A" || grade === "B") return "happy";
  return "neutral";
}

const CSS = `
.bk{position:relative;display:grid;place-items:center}
.bk .bk-aura{position:absolute;inset:0;margin:auto;width:82%;height:72%;border-radius:50%;
  filter:blur(22px);opacity:.5;z-index:0;background:var(--bk-aura);animation:bkPulse 2.4s ease-in-out infinite}
.bk svg{position:relative;z-index:1;width:100%;height:100%;overflow:visible}
.bk[data-mood="happy"]{--bk-aura:#facc15}
.bk[data-mood="neutral"]{--bk-aura:#fb923c}
.bk[data-mood="angry"]{--bk-aura:#f43f5e}
.bk .bk-fig{transform-origin:50% 92%}
.bk[data-mood="happy"] .bk-fig{animation:bkHop 1.25s cubic-bezier(.5,0,.5,1) infinite}
.bk[data-mood="neutral"] .bk-fig{animation:bkSway 3.4s ease-in-out infinite}
.bk[data-mood="angry"] .bk-fig{animation:bkShake .28s ease-in-out infinite}
.bk .m-happy,.bk .m-neutral,.bk .m-angry,.bk .brow,.bk .steam{display:none}
.bk[data-mood="happy"] .m-happy{display:block}
.bk[data-mood="happy"] .cheek{display:block}
.bk[data-mood="neutral"] .m-neutral{display:block}
.bk[data-mood="angry"] .m-angry,.bk[data-mood="angry"] .brow,.bk[data-mood="angry"] .steam{display:block}
.cheek{display:none}
.steam{animation:bkSteam 1.1s ease-out infinite}
.steam.s2{animation-delay:.45s}
@keyframes bkHop{0%,100%{transform:translateY(0) scaleY(1)}15%{transform:translateY(2px) scaleY(.96)}45%{transform:translateY(-14px) scaleY(1.03)}70%{transform:translateY(0) scaleY(.98)}}
@keyframes bkSway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes bkShake{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-4px) rotate(-1.5deg)}40%{transform:translateX(4px) rotate(1.5deg)}60%{transform:translateX(-3px) rotate(-1deg)}80%{transform:translateX(3px) rotate(1deg)}}
@keyframes bkPulse{0%,100%{opacity:.35;transform:scale(.92)}50%{opacity:.6;transform:scale(1.05)}}
@keyframes bkSteam{0%{opacity:0;transform:translateY(0) scale(.6)}30%{opacity:.85}100%{opacity:0;transform:translateY(-24px) scale(1.1)}}
@media (prefers-reduced-motion:reduce){.bk .bk-fig,.bk .bk-aura,.bk .steam{animation:none!important}}
`;

export function Mascot({
  mood,
  size = 150,
}: {
  mood: Mood;
  size?: number;
}) {
  return (
    <div
      className="bk"
      data-mood={mood}
      style={{ width: size, height: size * 1.16 }}
      aria-label={`Blocky ${mood}`}
      role="img"
    >
      <style>{CSS}</style>
      <div className="bk-aura" />
      <svg viewBox="0 0 160 190">
        {/* steam puffs (angry) */}
        <circle className="steam" cx="34" cy="42" r="6" fill="#f43f5e" opacity="0.7" />
        <circle className="steam s2" cx="126" cy="42" r="6" fill="#f43f5e" opacity="0.7" />
        {/* legs */}
        <rect x="52" y="150" width="24" height="34" rx="4" fill="#3b3f47" />
        <rect x="84" y="150" width="24" height="34" rx="4" fill="#3b3f47" />
        {/* torso */}
        <path d="M50 104 H110 L118 154 H42 Z" fill="#4f46e5" />
        {/* shield emblem */}
        <path
          d="M80 116 l14 5 v10 c0 9 -6 14 -14 18 c-8 -4 -14 -9 -14 -18 v-10 z"
          fill="#e8eaee"
          opacity="0.95"
        />
        <path d="M80 124 l6 2 v5 c0 4 -3 6 -6 8 c-3 -2 -6 -4 -6 -8 v-5 z" fill="#4f46e5" />
        {/* arms + C-hands */}
        <path d="M50 108 q-16 6 -18 30" stroke="#4f46e5" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M110 108 q16 6 18 30" stroke="#4f46e5" strokeWidth="12" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="140" r="8" fill="#f5c518" />
        <circle cx="130" cy="140" r="8" fill="#f5c518" />
        <g className="bk-fig">
          <rect x="70" y="96" width="20" height="12" fill="#d9ad14" />
          {/* stud + head */}
          <rect x="66" y="16" width="28" height="14" rx="6" fill="#f7d449" />
          <rect x="46" y="28" width="68" height="70" rx="18" fill="#f5c518" stroke="#c99a12" strokeWidth="2" />
          {/* angry brows */}
          <path className="brow" d="M56 50 L74 58" stroke="#141414" strokeWidth="5" strokeLinecap="round" />
          <path className="brow" d="M104 50 L86 58" stroke="#141414" strokeWidth="5" strokeLinecap="round" />
          {/* eyes */}
          <circle cx="66" cy="61" r="5.5" fill="#141414" />
          <circle cx="94" cy="61" r="5.5" fill="#141414" />
          <circle cx="64" cy="59" r="1.6" fill="#fff" />
          <circle cx="92" cy="59" r="1.6" fill="#fff" />
          {/* mouths */}
          <path className="m-happy" d="M64 76 Q80 91 96 76" stroke="#141414" strokeWidth="4" fill="none" strokeLinecap="round" />
          <line className="m-neutral" x1="66" y1="81" x2="94" y2="81" stroke="#141414" strokeWidth="4" strokeLinecap="round" />
          <path className="m-angry" d="M64 87 Q80 75 96 87" stroke="#141414" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* cheeks (happy) */}
          <circle className="cheek" cx="58" cy="76" r="5" fill="#ff6b6b" opacity="0.25" />
          <circle className="cheek" cx="102" cy="76" r="5" fill="#ff6b6b" opacity="0.25" />
        </g>
      </svg>
    </div>
  );
}
