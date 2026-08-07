"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setPin("");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-border bg-panel p-8 shadow-xl"
    >
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Authenticator</h1>
      <p className="mb-6 text-sm text-neutral-500">Enter your PIN to unlock</p>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="w-full rounded-lg border border-border bg-neutral-100 px-4 py-3 text-center text-2xl tracking-[0.4em] text-neutral-900 outline-none focus:border-accent"
        placeholder="••••••"
      />
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || pin.length === 0}
        className="mt-6 w-full rounded-lg bg-accent py-3 font-medium text-white transition-opacity disabled:opacity-50"
      >
        {loading ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
