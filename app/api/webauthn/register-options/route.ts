import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { loadCredentials } from "@/lib/credentials";
import {
  CHALLENGE_COOKIE_MAX_AGE,
  getRpId,
  REG_CHALLENGE_COOKIE,
  RP_NAME,
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

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpId(req),
    userName: "owner",
    userDisplayName: "Authenticator",
    attestationType: "none",
    excludeCredentials: credentials.map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });
  // Steer the OS/browser toward the device's own biometric sensor rather
  // than offering a cross-device ("scan this QR code") or security-key
  // option in the passkey picker.
  options.hints = ["client-device"];

  const res = NextResponse.json(options);
  res.cookies.set(REG_CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_COOKIE_MAX_AGE,
  });
  return res;
}
