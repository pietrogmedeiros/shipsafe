import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE } from "@/lib/auth";

// Next.js 16 renamed Middleware -> Proxy. This is an OPTIMISTIC gate only:
// it redirects users without a session cookie away from the app shell for a
// clean UX. Real authorization happens server-side via getSession() in each
// page/route (the docs warn Proxy is not a full auth solution).
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Protect the authenticated app shell.
  matcher: ["/app/:path*"],
};
