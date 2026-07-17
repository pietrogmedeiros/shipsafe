// Thin AbacatePay REST client (Pix). Docs: https://api.abacatepay.com/v2
// Auth: Bearer <API key>. Amounts in centavos. The Billing agent builds the
// upgrade + webhook routes on top of these primitives.

const BASE = process.env.ABACATEPAY_BASE_URL || "https://api.abacatepay.com/v2";
const KEY = process.env.ABACATEPAY_API_KEY || "";

interface AbacateResponse<T> {
  data: T;
  error: string | null;
  success?: boolean;
}

async function call<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as AbacateResponse<T>;
  if (!res.ok || json.error) {
    throw new Error(`AbacatePay ${path} failed: ${json.error || res.status}`);
  }
  return json.data;
}

export interface TransparentPix {
  id: string;
  brCode: string; // copy-paste Pix code
  brCodeBase64: string; // QR image (data)
}

// Creates an embedded Pix charge (transparent checkout) for the PRO upgrade.
// v2 uses a discriminated body: top-level `method` ("PIX"|"BOLETO") + `data`.
export function createPixCharge(input: {
  amount: number; // centavos
  description: string;
  customer: { name: string; email: string; taxId?: string; cellphone?: string };
  expiresIn?: number; // seconds
}): Promise<TransparentPix> {
  return call<TransparentPix>("/transparents/create", "POST", {
    method: "PIX",
    data: {
      amount: input.amount,
      description: input.description,
      expiresIn: input.expiresIn ?? 3600,
      customer: input.customer,
    },
  });
}

export interface CheckStatus {
  id: string;
  status: "PENDING" | "PAID" | "EXPIRED" | string;
}

// Poll a charge status (used as a fallback to the webhook).
// v2 status endpoint: GET /transparents/check?id=<id>.
export function getChargeStatus(id: string): Promise<CheckStatus> {
  return call<CheckStatus>(`/transparents/check?id=${encodeURIComponent(id)}`, "GET");
}

export const isConfigured = () => Boolean(KEY);
