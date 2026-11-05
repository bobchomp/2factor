import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { loadCredentials } from "@/lib/credentials";
import {
  CHALLENGE_COOKIE_MAX_AGE,
  getRpId,
  LOGIN_CHALLENGE_COOKIE,
} from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  let credentials;
  try {
    credentials = await loadCredentials();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load credentials." },
      { status: 500 }
    );
  }

  if (credentials.length === 0) {
    return NextResponse.json(
      { error: "Face ID isn't set up yet." },
      { status: 400 }
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: getRpId(req),
    allowCredentials: credentials.map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
    userVerification: "required",
  });
  options.hints = ["client-device"];

  const res = NextResponse.json(options);
  res.cookies.set(LOGIN_CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_COOKIE_MAX_AGE,
  });
  return res;
}
