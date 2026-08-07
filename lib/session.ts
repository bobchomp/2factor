import { getSessionSecret } from "./env";

export const SESSION_COOKIE = "tf_session";
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

async function getSessionKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export async function createSessionToken(
  ttlMs: number = DEFAULT_TTL_MS
): Promise<string> {
  const key = await getSessionKey();
  const payloadBytes = new TextEncoder().encode(
    JSON.stringify({ exp: Date.now() + ttlMs })
  );
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  return `${toBase64Url(payloadBytes)}.${toBase64Url(
    new Uint8Array(signature)
  )}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const [payloadPart, sigPart] = token.split(".");
  if (!payloadPart || !sigPart) return false;

  try {
    const key = await getSessionKey();
    const payloadBytes = fromBase64Url(payloadPart);
    const sigBytes = fromBase64Url(sigPart);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      payloadBytes
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    return typeof payload.exp === "number" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}
