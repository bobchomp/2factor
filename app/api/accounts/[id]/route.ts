import { NextRequest, NextResponse } from "next/server";
import { deleteAccount } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accounts = await deleteAccount(id);
  return NextResponse.json({ accounts });
}
