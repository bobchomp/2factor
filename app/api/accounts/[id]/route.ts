import { NextRequest, NextResponse } from "next/server";
import { deleteAccount } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const accounts = await deleteAccount(id);
    return NextResponse.json({ accounts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete account." },
      { status: 500 }
    );
  }
}
