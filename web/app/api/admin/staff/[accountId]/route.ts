import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { removeStaff, updateStaff } from "@/lib/adminData";

export async function PATCH(request: Request, { params }: { params: { accountId: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = body && typeof body.title === "string" ? body.title : null;
  if (!title) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const notes = typeof body.notes === "string" ? body.notes : null;
    await updateStaff(actor, params.accountId, { title, notes });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fmrp-web] /api/admin/staff/[accountId] PATCH failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { accountId: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    await removeStaff(actor, params.accountId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fmrp-web] /api/admin/staff/[accountId] DELETE failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
