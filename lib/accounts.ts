import { loadJson, saveJson } from "./store";
import type { Account } from "./types";

const VAULT_PATHNAME = "vault.enc.json";

export async function loadAccounts(): Promise<Account[]> {
  const data = await loadJson<Account[]>(VAULT_PATHNAME, []);
  return Array.isArray(data) ? data : [];
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  await saveJson(VAULT_PATHNAME, accounts);
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
