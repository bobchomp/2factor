"use client";

import { useEffect, useState } from "react";
import { generateCode } from "@/lib/totp";
import type { Account } from "@/lib/types";

export default function CodeCard({
  account,
  onDelete,
}: {
  account: Account;
  onDelete: (id: string) => void;
}) {
  const [{ code, secondsRemaining }, setState] = useState(() =>
    generateCode(account)
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => setState(generateCode(account));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [account]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard API unavailable, ignore
    }
  }

  const period = account.period || 30;
  const progress = secondsRemaining / period;
  const formatted =
    code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  return (
    <div className="group relative rounded-xl border border-border bg-panel p-4">
      <button
        onClick={() => onDelete(account.id)}
        className="absolute right-3 top-3 text-neutral-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        aria-label={`Remove ${account.label}`}
      >
        ✕
      </button>
      <p className="truncate pr-6 text-sm text-neutral-400">
        {account.issuer || account.label}
      </p>
      {account.issuer && (
        <p className="truncate pr-6 text-xs text-neutral-500">
          {account.label}
        </p>
      )}
      <button
        onClick={handleCopy}
        className="mt-2 block text-left font-mono text-3xl tracking-widest text-white"
      >
        {formatted}
      </button>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full bg-accent transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {copied && (
        <p className="absolute bottom-3 right-3 text-xs text-accent">
          Copied!
        </p>
      )}
    </div>
  );
}
