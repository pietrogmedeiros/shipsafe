import { NextRequest, NextResponse } from "next/server";

// Redirects to the latest SafeShip Desktop .dmg on GitHub Releases.
// Resolving the asset from the API (instead of hardcoding a versioned URL)
// keeps the download link stable across future releases.
const REPO = "pietrogmedeiros/shipsafe-desktop";
const RELEASES = `https://github.com/${REPO}/releases/latest`;

export const revalidate = 300; // cache the release lookup for 5 min

export async function GET(req: NextRequest) {
  const intel = req.nextUrl.searchParams.get("arch") === "intel";
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) throw new Error("release lookup failed");
    const data = (await res.json()) as {
      assets?: { name: string; browser_download_url: string }[];
    };
    const assets = data.assets ?? [];
    // Apple Silicon builds carry "arm64" in the filename; Intel is the other .dmg.
    const dmg = assets.find(
      (a) =>
        a.name.endsWith(".dmg") &&
        (intel ? !a.name.includes("arm64") : a.name.includes("arm64")),
    );
    if (!dmg) throw new Error("no matching dmg asset");
    return NextResponse.redirect(dmg.browser_download_url, 302);
  } catch {
    // Fall back to the releases page so the user can still grab a build.
    return NextResponse.redirect(RELEASES, 302);
  }
}
