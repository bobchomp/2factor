import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { NextRequest, NextResponse } from "next/server";
import { addCredential } from "@/lib/credentials";
import {
  getOrigin,
  getRpId,
  labelFromUserAgent,
  REG_CHALLENGE_COOKIE,
  toPublicCredential,
} from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const expectedChallenge = req.cookies.get(REG_CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json(
      { error: "That took too long - try again." },
      { status: 400 }
    );
  }

  let body: RegistrationResponseJSON;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpId(req),
      requireUserVerification: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not verify." },
      { status: 400 }
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json(
      { error: "Could not verify Face ID." },
      { status: 400 }
    );
  }

  const { credential } = verification.registrationInfo;

  try {
    const credentials = await addCredential({
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports,
      label: labelFromUserAgent(req.headers.get("user-agent")),
      createdAt: Date.now(),
    });

    const res = NextResponse.json({
      credentials: credentials.map(toPublicCredential),
    });
    res.cookies.set(REG_CHALLENGE_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save credential." },
      { status: 500 }
    );
  }
}
