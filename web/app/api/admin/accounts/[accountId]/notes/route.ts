import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { addPlayerNote, listPlayerNotes } from "@/lib/adminData";

export async function GET(_request: Request, { params }: { params: { accountId: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json(await listPlayerNotes(params.accountId));
  } catch (err) {
    console.error("[nbt-web] /api/admin/accounts/[accountId]/notes GET failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { accountId: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const note = body && typeof body.note === "string" ? body.note : null;
  if (!note) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await addPlayerNote(actor, params.accountId, note);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[nbt-web] /api/admin/accounts/[accountId]/notes POST failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
