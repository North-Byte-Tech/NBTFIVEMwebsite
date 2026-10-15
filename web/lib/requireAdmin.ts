import { getSession, HOST_BYPASS_USER_ID } from "@/lib/session";
import { DEVELOPER_PERMISSION, STAFF_ADMIN_PERMISSION } from "@/lib/permissions";

//export { STAFF_ADMIN_PERMISSION } from "@/lib/permissions";

export interface AdminActor {
  id: string;
  name: string | null;
}

// Session-level admin gate. This is now the ONLY check - there is no
// separate service re-deriving fmrp.staff.admin from anywhere else, so
// whatever this session says is authoritative. Every /admin page and
// /api/admin/* route calls this first and 403s/renders nothing if it comes
// back null.
export async function requireAdminActor(): Promise<AdminActor | null> {
  const session = await getSession();
  if (!session || !session.permissions.includes(STAFF_ADMIN_PERMISSION)) {
    return null;
  }
  return { id: session.userId, name: session.user?.name ?? null };
}

// Gate for /admin/dev - an admin who also holds the developer permission.
export async function requireDeveloperActor(): Promise<AdminActor | null> {
  const session = await getSession();
  if (
    !session
    || !session.permissions.includes(STAFF_ADMIN_PERMISSION)
    || !session.permissions.includes(DEVELOPER_PERMISSION)
  ) {
    return null;
  }
  return { id: session.userId, name: session.user?.name ?? null };
}

export async function requireFinalDecisionActor(): Promise<AdminActor | null> {
  const session = await getSession();
  if (!session || !session.permissions.includes(STAFF_ADMIN_PERMISSION)) {
    return null;
  }

  const configuredUserId = process.env.DECISION_BOARD_USER_ID?.trim();
  const configuredName = process.env.DECISION_BOARD_DISCORD_NAME?.trim();
  const sessionName = session.user?.name?.trim() ?? "";
  const sessionUserId = session.userId.trim();

  const isConfiguredDecisionAccount =
    (!!configuredUserId && sessionUserId === configuredUserId) ||
    (!!configuredName && sessionName.toLowerCase() === configuredName.toLowerCase());

  const isLocalDevelopmentOverride =
    process.env.NODE_ENV !== "production" && (
      sessionUserId === "dev-user" ||
      sessionName.toLowerCase() === "dev user"
    );

  // Guests on an AUTH_BYPASS_HOSTS domain are full admins, decisions included.
  const isHostBypassGuest = sessionUserId === HOST_BYPASS_USER_ID;

  if (!isConfiguredDecisionAccount && !isLocalDevelopmentOverride && !isHostBypassGuest) {
    return null;
  }

  return { id: session.userId, name: session.user?.name ?? null };
}
