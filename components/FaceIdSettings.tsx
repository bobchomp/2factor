"use client";

import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import type { PublicCredential } from "@/lib/webauthn";

export default function FaceIdSettings() {
  const [supported, setSupported] = useState(false);
  const [credentials, setCredentials] = useState<PublicCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    fetch("/api/webauthn/credentials")
      .then((res) => res.json())
      .then((data) => setCredentials(data.credentials || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleRegister() {
    setError(null);
    setRegistering(true);
    try {
      const optionsRes = await fetch("/api/webauthn/register-options", {
        method: "POST",
      });
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        setError(options.error || "Could not start setup.");
        return;
      }

      const attestation = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attestation),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(data.error || "Could not verify Face ID.");
        return;
      }

      setCredentials(data.credentials);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        setError("Cancelled.");
      } else {
        setError(err instanceof Error ? err.message : "Could not set up Face ID.");
      }
    } finally {
      setRegistering(false);
    }
  }

  async function handleRemove(id: string) {
    const previous = credentials;
    setCredentials((cs) => cs.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/webauthn/credentials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) setCredentials(previous);
    } catch {
      setCredentials(previous);
    }
  }

  if (!supported || loading) return null;

  return (
    <div className="mb-6 rounded-card border border-border bg-panel p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Face ID</p>
          <p className="text-xs text-muted">
            {credentials.length > 0
              ? "Unlock with Face ID instead of typing your PIN."
              : "Set up Face ID to skip typing your PIN on this device."}
          </p>
        </div>
        <button
          onClick={handleRegister}
          disabled={registering}
          className="rounded-control border border-accent bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent disabled:opacity-50"
        >
          {registering ? "Setting up…" : "+ Add this device"}
        </button>
      </div>

      {credentials.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {credentials.map((cred) => (
            <span
              key={cred.id}
              className="group flex items-center gap-1.5 rounded-control border border-border bg-bg py-1 pl-3 pr-1.5 text-xs text-muted"
            >
              {cred.label}
              <button
                onClick={() => handleRemove(cred.id)}
                aria-label={`Remove ${cred.label}`}
                className="rounded px-1 text-muted hover:text-danger"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
