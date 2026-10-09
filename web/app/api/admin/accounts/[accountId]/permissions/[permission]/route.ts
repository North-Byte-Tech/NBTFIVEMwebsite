import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { revokePermission } from "@/lib/adminData";

export async function DELETE(_request: Request, { params }: { params: { accountId: string; permission: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    await revokePermission(actor, params.accountId, decodeURIComponent(params.permission));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[nbt-web] /api/admin/accounts/[accountId]/permissions/[permission] DELETE failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
