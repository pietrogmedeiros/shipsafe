"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore — still send them home */
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="rounded-md px-2.5 py-1.5 text-sm text-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-50"
    >
      {busy ? "Saindo…" : "Sair"}
    </button>
  );
}
