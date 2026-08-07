import { list, put } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { decrypt, encrypt } from "./crypto";
import type { Account } from "./types";

const BLOB_PATHNAME = "vault.enc.json";
const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_FILE = path.join(LOCAL_DIR, "vault.enc.json");

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readRaw(): Promise<string | null> {
  if (useBlob()) {
    const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
    const match = blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!match) return null;
    const res = await fetch(match.url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  }

  try {
    return await fs.readFile(LOCAL_FILE, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function writeRaw(content: string): Promise<void> {
  if (useBlob()) {
    await put(BLOB_PATHNAME, content, {
      access: "public",
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
