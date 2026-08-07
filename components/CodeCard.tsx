"use client";

import { useEffect, useState } from "react";
import { getInitials } from "@/lib/format";
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
  const fillColor =
    progress <= 1 / 6 ? "bg-danger" : progress <= 1 / 3 ? "bg-warn" : "bg-accent";

  return (
    <div className="group relative rounded-card border border-border bg-panel p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">
            {account.issuer || account.label}
          </p>
          {account.issuer && (
            <p className="truncate text-xs text-muted/70">{account.label}</p>
          )}
        </div>
        <div className="relative h-7 w-7 flex-none">
          <div className="absolute inset-0 flex items-center justify-center rounded-control bg-accent-soft text-xs font-semibold text-accent transition-opacity group-hover:opacity-0">
            {getInitials(account.issuer || account.label)}
          </div>
          <button
            onClick={() => onDelete(account.id)}
            className="absolute inset-0 flex items-center justify-center rounded-control text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
            aria-label={`Remove ${account.label}`}
          >
            ✕
          </button>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="mt-2 block text-left font-mono text-3xl tracking-widest text-ink"
      >
        {formatted}
      </button>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full ${fillColor} transition-[width,background-color] duration-1000 ease-linear`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[11px] text-muted">{secondsRemaining}s left</p>
        {copied && (
          <p className="text-[11px] font-medium text-accent">Copied!</p>
        )}
      </div>
    </div>
  );
}
