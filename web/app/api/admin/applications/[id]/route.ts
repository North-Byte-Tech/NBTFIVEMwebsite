import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { updateApplicationStatus } from "@/lib/adminData";

const VALID_STATUSES = new Set([
  "pending",
  "interview_scheduled",
  "interview_completed",
  "awaiting_final_decision",
  "accepted",
  "rejected",
]);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await updateApplicationStatus(actor, params.id, status as any, {
      interviewDate: typeof body?.interviewDate === "string" ? body.interviewDate : null,
      notes: typeof body?.notes === "string" ? body.notes : null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[nbt-web] /api/admin/applications/[id] failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
