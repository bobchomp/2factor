import { NextResponse } from "next/server";
import { loadCredentials } from "@/lib/credentials";

export async function GET() {
  try {
    const credentials = await loadCredentials();
    return NextResponse.json({ registered: credentials.length > 0 });
  } catch {
    // If storage isn't reachable, just hide the Face ID option - PIN still works.
    return NextResponse.json({ registered: false });
  }
}
