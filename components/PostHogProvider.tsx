"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

// The key/host come from the server (runtime env) as props, so nothing needs
// to be inlined at build time. When no key is set, this is a transparent no-op.
export function PostHogProvider({
  apiKey,
  host,
  children,
}: {
  apiKey?: string;
  host?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!apiKey || posthog.__loaded) return;
    posthog.init(apiKey, {
      api_host: host || "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com",
      capture_pageview: false, // handled manually for SPA navigations
      capture_pageleave: true,
      person_profiles: "identified_only",
      defaults: "2025-05-24",
    });
  }, [apiKey, host]);

  if (!apiKey) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;
    let url = window.location.origin + pathname;
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}
