import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAppPin } from "@/lib/env";
import {
  ATTEMPTS_COOKIE,
  msUntilUnlocked,
  parseAttempts,
  recordFailure,
  serializeAttempts,
} from "@/lib/rateLimit";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

function timingSafeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    timingSafeEqual(aBuf, aBuf); // keep timing roughly constant
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: NextRequest) {
  const attemptsState = parseAttempts(
    req.cookies.get(ATTEMPTS_COOKIE)?.value
  );
  const remaining = msUntilUnlocked(attemptsState);
  if (remaining > 0) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${Math.ceil(
          remaining / 1000
        )}s.`,
      },
      { status: 429 }
    );
  }

  let pin: unknown;
  try {
    const body = await req.json();
    pin = body?.pin;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof pin !== "string" || pin.length === 0) {
    return NextResponse.json({ error: "PIN is required." }, { status: 400 });
  }

  let expectedPin: string;
  try {
    expectedPin = getAppPin();
  } catch {
    return NextResponse.json(
      { error: "Server is not configured (APP_PIN missing)." },
      { status: 500 }
    );
  }

  if (!timingSafeCompare(pin, expectedPin)) {
    const nextState = recordFailure(attemptsState);
    const res = NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    res.cookies.set(ATTEMPTS_COOKIE, serializeAttempts(nextState), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5,
    });
    return res;
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  res.cookies.set(ATTEMPTS_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
