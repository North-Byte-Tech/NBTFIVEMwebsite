import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { submitDepartmentApplication } from "@/lib/applications";
import type { DepartmentCode } from "@/lib/departments";

const VALID_DEPARTMENTS: DepartmentCode[] = ["LEO", "SAFD", "SAEMS", "DISPATCH", "CIV"];

interface ApplicationRequestBody {
  department: DepartmentCode;
  answers: Record<string, string>;
}

function isValidBody(body: unknown): body is ApplicationRequestBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const candidate = body as Partial<ApplicationRequestBody>;
  return (
    typeof candidate.department === "string"
    && VALID_DEPARTMENTS.includes(candidate.department as DepartmentCode)
    && typeof candidate.answers === "object"
    && candidate.answers !== null
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.discordId) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await submitDepartmentApplication({
      discordId: session.discordId,
      discordUsername: session.user?.name ?? "unknown",
      department: body.department,
      answers: body.answers,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[nbt-web] /api/applications failed:", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
