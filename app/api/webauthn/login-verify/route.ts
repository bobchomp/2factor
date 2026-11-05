import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { loadCredentials, updateCredentialCounter } from "@/lib/credentials";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";
import { getOrigin, getRpId, LOGIN_CHALLENGE_COOKIE } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const expectedChallenge = req.cookies.get(LOGIN_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "That took too long - try again." },
      { status: 400 }
    );
  }

  let body: AuthenticationResponseJSON;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let credentials;
  try {
    credentials = await loadCredentials();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load credentials." },
      { status: 500 }
    );
  }

  const stored = credentials.find((c) => c.id === body.id);
  if (!stored) {
    return NextResponse.json(
      { error: "Unrecognized passkey." },
      { status: 400 }
    );
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpId(req),
      credential: {
        id: stored.id,
        publicKey: new Uint8Array(Buffer.from(stored.publicKey, "base64url")),
        counter: stored.counter,
        transports: stored.transports as AuthenticatorTransport[] | undefined,
      },
      requireUserVerification: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not verify." },
      { status: 400 }
    );
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Could not verify." }, { status: 401 });
  }

  try {
    await updateCredentialCounter(
      stored.id,
      verification.authenticationInfo.newCounter
    );
  } catch {
    // Non-fatal - worst case the counter-based replay check is slightly
    // stale next time; don't block a verified login over it.
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
  res.cookies.set(LOGIN_CHALLENGE_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
