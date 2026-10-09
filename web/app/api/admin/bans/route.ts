import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { banAccount, listBans } from "@/lib/adminData";

export async function GET() {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json(await listBans());
  } catch (err) {
    console.error("[fmrp-web] /api/admin/bans GET failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

interface BanRequestBody {
  accountId: string;
  reason: string;
  expiresAt: string | null;
}

function isValidBody(body: unknown): body is BanRequestBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const candidate = body as Partial<BanRequestBody>;
  return typeof candidate.accountId === "string" && typeof candidate.reason === "string" && candidate.reason.length > 0;
}

export async function POST(request: Request) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await banAccount(actor, { accountId: body.accountId, reason: body.reason, expiresAt: body.expiresAt ?? null });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fmrp-web] /api/admin/bans POST failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
