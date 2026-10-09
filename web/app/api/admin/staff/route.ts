import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { appointStaff, listStaff } from "@/lib/adminData";

export async function GET() {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json(await listStaff());
  } catch (err) {
    console.error("[fmrp-web] /api/admin/staff GET failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const accountId = body && typeof body.accountId === "string" ? body.accountId : null;
  const title = body && typeof body.title === "string" ? body.title : null;
  if (!accountId || !title) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const notes = typeof body.notes === "string" ? body.notes : null;
    await appointStaff(actor, { accountId, title, notes });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fmrp-web] /api/admin/staff POST failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
