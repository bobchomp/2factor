"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Account } from "@/lib/types";
import AddAccountModal from "./AddAccountModal";
import CodeCard from "./CodeCard";

type AddPayload = {
  uri?: string;
  issuer?: string;
  label?: string;
  secret?: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(payload: AddPayload): Promise<string | null> {
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Could not add account.";
    setAccounts(data.accounts);
    setShowAdd(false);
    return null;
  }

  async function handleDelete(id: string) {
    const previous = accounts;
    setAccounts((accts) => accts.filter((a) => a.id !== id));
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (!res.ok) setAccounts(previous);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Authenticator</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              + Add account
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-border px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
            >
              Lock
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-neutral-500">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-neutral-500">
            No accounts yet. Add one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {accounts.map((account) => (
              <CodeCard
                key={account.id}
                account={account}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddAccountModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />
      )}
    </main>
  );
}
