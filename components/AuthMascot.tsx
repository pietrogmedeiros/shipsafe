"use client";

import { createContext, useContext, useState } from "react";

// Shared state so the login/signup form can drive Blocky's reactions:
// - typing the password → Blocky turns his head away (no peeking!)
// - wrong password → Blocky gets sad.
interface AuthMascotCtx {
  typingPassword: boolean;
  error: boolean;
  setTypingPassword: (v: boolean) => void;
  setError: (v: boolean) => void;
}

const Ctx = createContext<AuthMascotCtx | null>(null);

export function AuthMascotProvider({ children }: { children: React.ReactNode }) {
  const [typingPassword, setTypingPassword] = useState(false);
  const [error, setError] = useState(false);
  return (
    <Ctx.Provider value={{ typingPassword, error, setTypingPassword, setError }}>
      {children}
    </Ctx.Provider>
  );
}

// Safe no-op fallback if a form renders outside the provider.
export function useAuthMascot(): Pick<
  AuthMascotCtx,
  "setTypingPassword" | "setError"
> {
  const ctx = useContext(Ctx);
  return {
    setTypingPassword: ctx?.setTypingPassword ?? (() => {}),
    setError: ctx?.setError ?? (() => {}),
  };
}

const CSS = `
.am{position:relative;display:grid;place-items:center}
.am .am-aura{position:absolute;inset:0;margin:auto;width:78%;height:70%;border-radius:50%;
  filter:blur(24px);opacity:.45;z-index:0;background:#facc15;transition:background .4s ease}
.am[data-state="sad"] .am-aura{background:#64748b;opacity:.3}
.am svg{position:relative;z-index:1;width:100%;height:100%;overflow:visible}
.am .fig{transform-origin:50% 92%}
.am[data-state="idle"] .fig{animation:amHop 1.6s cubic-bezier(.5,0,.5,1) infinite}
.am .head{transform-origin:80px 98px;transition:transform .4s cubic-bezier(.34,1.2,.64,1)}
.am[data-state="away"] .head{transform:rotate(-22deg) translateX(-3px)}
.am[data-state="sad"] .head{transform:translateY(4px) rotate(-3deg)}
.am .eyes{transition:transform .35s ease}
.am[data-state="away"] .eyes{transform:translateX(-8px)}
.am[data-state="sad"] .eyes{transform:translateY(3px)}
.am .m-smile{display:block}
.am .m-sad,.am .brow,.am .tear{display:none}
.am[data-state="sad"] .m-smile{display:none}
.am[data-state="sad"] .m-sad,.am[data-state="sad"] .brow,.am[data-state="sad"] .tear{display:block}
.am .tear{animation:amTear 1.6s ease-in-out infinite}
@keyframes amHop{0%,100%{transform:translateY(0)}45%{transform:translateY(-9px)}}
@keyframes amTear{0%,100%{opacity:.5;transform:translateY(0)}50%{opacity:1;transform:translateY(4px)}}
@media (prefers-reduced-motion:reduce){.am .fig,.am .tear{animation:none!important}}
`;

export function AuthMascot({ size = 240 }: { size?: number }) {
  const ctx = useContext(Ctx);
  const state = ctx?.error ? "sad" : ctx?.typingPassword ? "away" : "idle";

  return (
    <div
      className="am"
      data-state={state}
      style={{ width: size, height: size * 1.16 }}
      role="img"
      aria-label={`Blocky ${state}`}
    >
      <style>{CSS}</style>
      <div className="am-aura" />
      <svg viewBox="0 0 160 190">
        {/* legs */}
        <rect x="52" y="150" width="24" height="34" rx="4" fill="#3b3f47" />
        <rect x="84" y="150" width="24" height="34" rx="4" fill="#3b3f47" />
        {/* torso + shield */}
        <path d="M50 104 H110 L118 154 H42 Z" fill="#4f46e5" />
        <path d="M80 116 l14 5 v10 c0 9 -6 14 -14 18 c-8 -4 -14 -9 -14 -18 v-10 z" fill="#e8eaee" opacity="0.95" />
        <path d="M80 124 l6 2 v5 c0 4 -3 6 -6 8 c-3 -2 -6 -4 -6 -8 v-5 z" fill="#4f46e5" />
        {/* arms + hands */}
        <path d="M50 108 q-16 6 -18 30" stroke="#4f46e5" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M110 108 q16 6 18 30" stroke="#4f46e5" strokeWidth="12" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="140" r="8" fill="#f5c518" />
        <circle cx="130" cy="140" r="8" fill="#f5c518" />
        <g className="fig">
          <rect x="70" y="96" width="20" height="12" fill="#d9ad14" />
          <g className="head">
            {/* stud + head */}
            <rect x="66" y="16" width="28" height="14" rx="6" fill="#f7d449" />
            <rect x="46" y="28" width="68" height="70" rx="18" fill="#f5c518" stroke="#c99a12" strokeWidth="2" />
            {/* sad brows */}
            <path className="brow" d="M58 48 L74 54" stroke="#141414" strokeWidth="4" strokeLinecap="round" />
            <path className="brow" d="M102 48 L86 54" stroke="#141414" strokeWidth="4" strokeLinecap="round" />
            <g className="eyes">
              <circle cx="66" cy="61" r="5.5" fill="#141414" />
              <circle cx="94" cy="61" r="5.5" fill="#141414" />
              <circle cx="64" cy="59" r="1.6" fill="#fff" />
              <circle cx="92" cy="59" r="1.6" fill="#fff" />
            </g>
            {/* tear (sad) */}
            <path className="tear" d="M62 70 q-3 5 0 8 q3 -3 0 -8 z" fill="#7dd3fc" />
            {/* mouths */}
            <path className="m-smile" d="M64 76 Q80 90 96 76" stroke="#141414" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path className="m-sad" d="M64 86 Q80 74 96 86" stroke="#141414" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* cheeks */}
            <circle cx="58" cy="76" r="5" fill="#ff6b6b" opacity="0.22" />
            <circle cx="102" cy="76" r="5" fill="#ff6b6b" opacity="0.22" />
          </g>
        </g>
      </svg>
    </div>
  );
}
