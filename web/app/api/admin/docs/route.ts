import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { createDoc, DocValidationError, listDocs, parseDocInput } from "@/lib/docs";

export async function GET(request: Request) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  try {
    return NextResponse.json(
      await listDocs({ query: params.get("q") ?? undefined, category: params.get("category") ?? undefined }),
    );
  } catch (err) {
    console.error("[fmrp-web] /api/admin/docs GET failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const input = parseDocInput(await request.json().catch(() => null));
    const { slug } = await createDoc(actor, input);
    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    if (err instanceof DocValidationError) {
      return NextResponse.json({ ok: false, error: "invalid_payload", message: err.message }, { status: 400 });
    }
    console.error("[fmrp-web] /api/admin/docs POST failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
