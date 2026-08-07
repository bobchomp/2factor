import { get, list, put } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { decrypt, encrypt } from "./crypto";
import type { Account } from "./types";

const BLOB_PATHNAME = "vault.enc.json";
const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_FILE = path.join(LOCAL_DIR, "vault.enc.json");

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

async function readRaw(): Promise<string | null> {
  assertStorageAvailable();
  if (useBlob()) {
    const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
    const match = blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!match) return null;
    const result = await get(match.pathname, {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return await new Response(result.stream).text();
  }

  try {
    return await fs.readFile(LOCAL_FILE, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function writeRaw(content: string): Promise<void> {
  assertStorageAvailable();
  if (useBlob()) {
    await put(BLOB_PATHNAME, content, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(LOCAL_FILE, content, "utf8");
}

export async function loadAccounts(): Promise<Account[]> {
  const raw = await readRaw();
  if (!raw) return [];
  const plaintext = await decrypt(raw);
  const data = JSON.parse(plaintext);
  return Array.isArray(data) ? data : [];
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  const ciphertext = await encrypt(JSON.stringify(accounts));
  await writeRaw(ciphertext);
}

export async function addAccount(account: Account): Promise<Account[]> {
  const accounts = await loadAccounts();
  accounts.push(account);
  await saveAccounts(accounts);
  return accounts;
}

export async function deleteAccount(id: string): Promise<Account[]> {
  const accounts = await loadAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  await saveAccounts(filtered);
  return filtered;
}
