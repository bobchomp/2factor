import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { addAccount, loadAccounts } from "@/lib/store";
import { normalizeSecret, parseOtpAuthUri } from "@/lib/totp";
import type { Account } from "@/lib/types";

export async function GET() {
  const accounts = await loadAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  let body: {
    uri?: unknown;
    issuer?: unknown;
    label?: unknown;
    secret?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let issuer = "";
  let label = "";
  let secret = "";
  let algorithm = "SHA1";
  let digits = 6;
  let period = 30;

  try {
    if (typeof body.uri === "string" && body.uri.trim()) {
      const parsed = parseOtpAuthUri(body.uri.trim());
      issuer = parsed.issuer;
      label = parsed.label;
      secret = parsed.secret;
      algorithm = parsed.algorithm;
      digits = parsed.digits;
      period = parsed.period;
    } else {
      if (typeof body.secret !== "string" || !body.secret.trim()) {
        return NextResponse.json(
          { error: "Secret is required." },
          { status: 400 }
        );
      }
      secret = normalizeSecret(body.secret);
      issuer = typeof body.issuer === "string" ? body.issuer.trim() : "";
      label = typeof body.label === "string" ? body.label.trim() : "";
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not parse account.",
      },
      { status: 400 }
    );
  }

  if (!label && !issuer) {
    return NextResponse.json(
      { error: "Give this account a name." },
      { status: 400 }
    );
  }
  if (!label) label = issuer;

  const account: Account = {
    id: randomUUID(),
    issuer,
    label,
    secret,
    algorithm,
    digits,
    period,
    createdAt: Date.now(),
  };

  const accounts = await addAccount(account);
  return NextResponse.json({ accounts }, { status: 201 });
}
