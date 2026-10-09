import { NextResponse } from "next/server";
import { requireAdminActor } from "@/lib/requireAdmin";
import { searchAccounts } from "@/lib/adminData";

export async function GET(request: Request) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  try {
    return NextResponse.json(await searchAccounts(query));
  } catch (err) {
    console.error("[nbt-web] /api/admin/accounts/search failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
