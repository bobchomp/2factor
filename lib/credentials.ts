import { loadJson, saveJson } from "./store";
import type { StoredCredential } from "./types";

const CREDENTIALS_PATHNAME = "webauthn.enc.json";

export async function loadCredentials(): Promise<StoredCredential[]> {
  const data = await loadJson<StoredCredential[]>(CREDENTIALS_PATHNAME, []);
  return Array.isArray(data) ? data : [];
}

export async function saveCredentials(
  credentials: StoredCredential[]
): Promise<void> {
  await saveJson(CREDENTIALS_PATHNAME, credentials);
}

export async function addCredential(
  credential: StoredCredential
): Promise<StoredCredential[]> {
  const credentials = await loadCredentials();
  credentials.push(credential);
  await saveCredentials(credentials);
  return credentials;
}

export async function removeCredential(
  id: string
): Promise<StoredCredential[]> {
  const credentials = await loadCredentials();
  const filtered = credentials.filter((c) => c.id !== id);
  await saveCredentials(filtered);
  return filtered;
}

export async function updateCredentialCounter(
  id: string,
  counter: number
): Promise<void> {
  const credentials = await loadCredentials();
  const match = credentials.find((c) => c.id === id);
  if (!match) return;
  match.counter = counter;
  await saveCredentials(credentials);
}
