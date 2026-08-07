import { getEncryptionKey } from "./env";

async function getKey(): Promise<CryptoKey> {
  const raw = Buffer.from(getEncryptionKey(), "base64");
  if (raw.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be a base64-encoded 32-byte key. Generate one with `openssl rand -base64 32`."
    );
  }
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

// Encrypts plaintext with AES-256-GCM. Output is base64(iv || ciphertext).
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return Buffer.concat([Buffer.from(iv), Buffer.from(ciphertext)]).toString(
    "base64"
  );
}

export async function decrypt(payload: string): Promise<string> {
  const key = await getKey();
  const combined = Buffer.from(payload, "base64");
  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}
