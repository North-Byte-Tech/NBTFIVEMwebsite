import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { listStaffActions } from "@/lib/adminData";

export async function GET() {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json(await listStaffActions());
  } catch (err) {
    console.error("[nbt-web] /api/admin/staff-actions failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
