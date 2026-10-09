import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { unbanAccount } from "@/lib/adminData";

export async function POST(_request: Request, { params }: { params: { accountId: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    await unbanAccount(actor, params.accountId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fmrp-web] /api/admin/bans/[accountId]/unban failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
