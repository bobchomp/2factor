"use client";

import {
  browserSupportsWebAuthn,
  startAuthentication,
} from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "backspace"];

function FaceIdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 8V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 8V6a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M9 15c.8.6 1.8 1 3 1s2.2-.4 3-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const busy = loading || faceIdLoading;

  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    let cancelled = false;
    fetch("/api/webauthn/status")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.registered) setFaceIdAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function handleKeypad(key: string) {
    if (busy) return;
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

  async function handleFaceId() {
    setError(null);
    setFaceIdLoading(true);
    try {
      const optionsRes = await fetch("/api/webauthn/login-options", {
        method: "POST",
      });
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        setError(options.error || "Face ID isn't available.");
        return;
      }

      const assertion = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(data.error || "Could not verify Face ID.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        setError("Face ID cancelled.");
      } else {
        setError(err instanceof Error ? err.message : "Could not use Face ID.");
      }
    } finally {
      setFaceIdLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-card border border-border bg-panel p-8 shadow-soft"
    >
      <h1 className="mb-1 text-xl font-semibold text-ink">Authenticator</h1>
      <p className="mb-6 text-sm text-muted">
        {faceIdAvailable ? "Use Face ID or enter your PIN" : "Enter your PIN to unlock"}
      </p>

      {faceIdAvailable && (
        <>
          <button
            type="button"
            onClick={handleFaceId}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-control border border-accent bg-accent-soft py-3 font-medium text-accent transition-opacity disabled:opacity-50"
          >
            <FaceIdIcon />
            {faceIdLoading ? "Waiting for Face ID…" : "Unlock with Face ID"}
          </button>
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or enter your PIN</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <input
        type="password"
        inputMode="numeric"
        autoFocus={!faceIdAvailable}
        disabled={busy}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="w-full rounded-control border-[1.5px] border-accent bg-accent-soft px-4 py-3 text-center text-2xl tracking-[0.4em] text-ink outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
        placeholder="••••••"
      />

      <div className="mx-auto mt-5 grid max-w-[248px] grid-cols-3 gap-2.5">
        {KEYPAD_KEYS.map((key, i) =>
          key ? (
            <button
              key={key}
              type="button"
              disabled={busy}
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
        disabled={busy || pin.length === 0}
        className="mt-6 w-full rounded-control bg-accent py-3 font-medium text-white transition-opacity disabled:opacity-50"
      >
        {loading ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
