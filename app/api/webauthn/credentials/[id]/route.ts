import { NextRequest, NextResponse } from "next/server";
import { removeCredential } from "@/lib/credentials";
import { toPublicCredential } from "@/lib/webauthn";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const credentials = await removeCredential(id);
    return NextResponse.json({ credentials: credentials.map(toPublicCredential) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not remove credential." },
      { status: 500 }
    );
  }
}
