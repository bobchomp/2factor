"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"];

export default function LoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleKeypad(key: string) {
    if (loading) return;
    if (key === "backspace") {
      setPin((prev) => prev.slice(0, -1));
    } else if (key) {
      setPin((prev) => prev + key);
    }
  }

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
      className="w-full max-w-sm rounded-card border border-border bg-panel p-8 shadow-soft"
    >
      <h1 className="mb-1 text-xl font-semibold text-ink">Authenticator</h1>
      <p className="mb-6 text-sm text-muted">Enter your PIN to unlock</p>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="w-full rounded-control border-[1.5px] border-accent bg-accent-soft px-4 py-3 text-center text-2xl tracking-[0.4em] text-ink outline-none focus:ring-2 focus:ring-accent/30"
        placeholder="••••••"
      />

      <div className="mx-auto mt-5 grid max-w-[248px] grid-cols-3 gap-2.5">
        {KEYPAD_KEYS.map((key, i) =>
          key ? (
            <button
              key={key}
              type="button"
              disabled={loading}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleKeypad(key)}
              className="aspect-square rounded-full border border-border bg-panel text-lg font-medium text-ink transition-colors hover:border-accent hover:bg-accent-soft active:bg-accent-soft disabled:opacity-50"
              aria-label={key === "backspace" ? "Delete last digit" : key}
            >
              {key === "backspace" ? "⌫" : key}
            </button>
          ) : (
            <span key={`spacer-${i}`} aria-hidden="true" />
          )
        )}
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading || pin.length === 0}
        className="mt-6 w-full rounded-control bg-accent py-3 font-medium text-white transition-opacity disabled:opacity-50"
      >
        {loading ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
