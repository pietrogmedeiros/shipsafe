"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroUrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = url.trim();
    if (!v) {
      router.push("/signup");
      return;
    }
    router.push(`/signup?url=${encodeURIComponent(v)}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-faint">
          https://
        </span>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="cole a URL do seu app"
          autoComplete="url"
          className="w-full rounded-lg border border-border bg-surface/80 py-3 pl-[4.6rem] pr-3 font-mono text-sm text-ink placeholder:text-faint outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <button
        type="submit"
        className="btn-glow shrink-0 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-black hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        Escanear grátis
      </button>
    </form>
  );
}
