// Email canonicalization + disposable-domain screening.
//
// Bots flood signups with Gmail's alias tricks: dots and "+tag" in the local
// part are ignored by Gmail, so a.t.a.naxawum.8.9.6@gmail.com and
// atanaxawum896@gmail.com hit the same inbox. We canonicalize so those all
// collapse to ONE identity — a second registration then trips EMAIL_TAKEN.

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

// A short, high-signal blocklist of throwaway/disposable providers. Not
// exhaustive by design — just the ones abuse traffic actually uses.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "throwawaymail.com",
  "yopmail.com",
  "getnada.com",
  "trashmail.com",
  "sharklasers.com",
  "maildrop.cc",
  "dispostable.com",
  "fakeinbox.com",
  "mohmal.com",
  "emailondeck.com",
]);

function splitEmail(raw: string): { local: string; domain: string } | null {
  const email = raw.toLowerCase().trim();
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

/**
 * Return the canonical form used for identity/dedupe. For Gmail: strip dots,
 * drop everything after the first "+", normalize domain to gmail.com. For
 * everything else: just drop the "+tag" and lowercase.
 */
export function canonicalizeEmail(raw: string): string {
  const parts = splitEmail(raw);
  if (!parts) return raw.toLowerCase().trim();
  let { local } = parts;
  const { domain } = parts;
  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);
  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replace(/\./g, "");
    return `${local}@gmail.com`;
  }
  return `${local}@${domain}`;
}

/** True if the address uses a known disposable/throwaway email provider. */
export function isDisposableEmail(raw: string): boolean {
  const parts = splitEmail(raw);
  if (!parts) return false;
  return DISPOSABLE_DOMAINS.has(parts.domain);
}
