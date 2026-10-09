import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { grantPermission, listAccountPermissions } from "@/lib/adminData";

export async function GET(_request: Request, { params }: { params: { accountId: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json(await listAccountPermissions(params.accountId));
  } catch (err) {
    console.error("[nbt-web] /api/admin/accounts/[accountId]/permissions GET failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { accountId: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const permission = body && typeof body.permission === "string" ? body.permission : null;
  if (!permission) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await grantPermission(actor, params.accountId, permission);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[nbt-web] /api/admin/accounts/[accountId]/permissions POST failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
