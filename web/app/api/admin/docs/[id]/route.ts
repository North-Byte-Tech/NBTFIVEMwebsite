import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminActor } from "@/lib/requireAdmin";
import { deleteDoc, DocValidationError, parseDocInput, updateDoc } from "@/lib/docs";

function isNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const input = parseDocInput(await request.json().catch(() => null));
    const { slug } = await updateDoc(actor, params.id, input);
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    if (err instanceof DocValidationError) {
      return NextResponse.json({ ok: false, error: "invalid_payload", message: err.message }, { status: 400 });
    }
    if (isNotFound(err)) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    console.error("[fmrp-web] /api/admin/docs/[id] PATCH failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    await deleteDoc(actor, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (isNotFound(err)) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    console.error("[fmrp-web] /api/admin/docs/[id] DELETE failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
