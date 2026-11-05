import { get, list, put } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { decrypt, encrypt } from "./crypto";

const LOCAL_DIR = path.join(process.cwd(), ".data");

function useBlob(): boolean {
  // A connected store gives you either a static BLOB_READ_WRITE_TOKEN, or
  // (for Private stores connected without that token) just BLOB_STORE_ID,
  // with the SDK authenticating via the project's short-lived OIDC token.
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function assertStorageAvailable(): void {
  // Vercel's serverless functions have a read-only filesystem (aside from
  // /tmp), so the local-file fallback only works for local dev.
  if (!useBlob() && process.env.VERCEL) {
    throw new Error(
      "No storage is connected. In your Vercel project, go to Storage -> Create Database -> Blob, connect it to this project, then redeploy."
    );
  }
}

async function readRaw(pathname: string): Promise<string | null> {
  assertStorageAvailable();
  if (useBlob()) {
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const match = blobs.find((b) => b.pathname === pathname);
    if (!match) return null;
    const result = await get(match.pathname, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return await new Response(result.stream).text();
  }

  try {
    return await fs.readFile(path.join(LOCAL_DIR, pathname), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function writeRaw(pathname: string, content: string): Promise<void> {
  assertStorageAvailable();
  if (useBlob()) {
    await put(pathname, content, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, pathname), content, "utf8");
}

// Generic encrypted JSON file, keyed by pathname. Used for both the
// accounts vault and the WebAuthn credential list - separate files, same
// storage/encryption mechanics.
export async function loadJson<T>(pathname: string, fallback: T): Promise<T> {
  const raw = await readRaw(pathname);
  if (!raw) return fallback;
  const plaintext = await decrypt(raw);
  return JSON.parse(plaintext) as T;
}

export async function saveJson<T>(pathname: string, data: T): Promise<void> {
  const ciphertext = await encrypt(JSON.stringify(data));
  await writeRaw(pathname, ciphertext);
}
