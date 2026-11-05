import { NextResponse } from "next/server";
import { loadCredentials } from "@/lib/credentials";
import { toPublicCredential } from "@/lib/webauthn";

export async function GET() {
  try {
    const credentials = await loadCredentials();
    return NextResponse.json({ credentials: credentials.map(toPublicCredential) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load credentials." },
      { status: 500 }
    );
  }
}
