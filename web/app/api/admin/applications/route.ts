import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { listApplications } from "@/lib/adminData";
import type { ApplicationStatus } from "@/lib/applications";

export async function GET(request: Request) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const status = new URL(request.url).searchParams.get("status") as ApplicationStatus | null;

  try {
    return NextResponse.json(await listApplications(status ?? undefined));
  } catch (err) {
    console.error("[fmrp-web] /api/admin/applications failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
