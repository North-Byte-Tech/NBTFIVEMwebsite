// Direct Prisma-backed replacement for the old lib/adminApi.ts, which used
// to call out to a separate portal-api service backed by the FiveM game
// server's MySQL database. That service is retired - every admin feature
// below reads/writes this app's own Postgres database instead, so
// "accountId" throughout this file means a website User.id (a Prisma cuid
// string), not a FiveM game account number.
//
// None of these functions re-check the caller's permission themselves -
// requireAdminActor() (see lib/requireAdmin.ts) is the one gate, called by
// every /admin page and /api/admin/* route before any of this runs.
import { Prisma, type ApplicationStatus } from "@prisma/client";
import { prisma } from "./prisma";
import type { AdminActor } from "./requireAdmin";
import { PERMISSION_CATALOG, type PermissionCatalogEntry } from "./permissions";
import type { DepartmentCode } from "./departments";

async function logAction(
  actor: AdminActor,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: string | null,
): Promise<void> {
  await prisma.auditLog.create({
    data: { actorId: actor.id, actorName: actor.name, action, targetType, targetId, details },
  });
}

function isActiveBan(ban: { expiresAt: Date | null } | null): boolean {
  return Boolean(ban && (!ban.expiresAt || ban.expiresAt > new Date()));
}

export interface AccountSearchResult {
  accountId: string;
  discordName: string | null;
  discordId: string | null;
  isBanned: boolean;
}

export async function getAccount(accountId: string): Promise<AccountSearchResult | null> {
  const user = await prisma.user.findUnique({ where: { id: accountId }, include: { ban: true } });
  if (!user) {
    return null;
  }
  return { accountId: user.id, discordName: user.name, discordId: user.discordId, isBanned: isActiveBan(user.ban) };
}

export async function searchAccounts(query: string): Promise<AccountSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: trimmed },
        { discordId: trimmed },
        { name: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    include: { ban: true },
    take: 25,
  });
  return users.map((user) => ({
    accountId: user.id,
    discordName: user.name,
    discordId: user.discordId,
    isBanned: isActiveBan(user.ban),
  }));
}

export interface BannedAccountRow {
  accountId: string;
  discordName: string | null;
  reason: string;
  bannedAt: string;
  expiresAt: string | null;
  bannedByName: string | null;
}

export async function listBans(): Promise<BannedAccountRow[]> {
  const bans = await prisma.ban.findMany({
    where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { user: true },
    orderBy: { bannedAt: "desc" },
  });
  return bans.map((ban) => ({
    accountId: ban.userId,
    discordName: ban.user.name,
    reason: ban.reason,
    bannedAt: ban.bannedAt.toISOString(),
    expiresAt: ban.expiresAt?.toISOString() ?? null,
    bannedByName: ban.bannedByName,
  }));
}

export async function banAccount(
  actor: AdminActor,
  input: { accountId: string; reason: string; expiresAt: string | null },
): Promise<void> {
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  await prisma.ban.upsert({
    where: { userId: input.accountId },
    create: { userId: input.accountId, reason: input.reason, expiresAt, bannedById: actor.id, bannedByName: actor.name },
    update: { reason: input.reason, expiresAt, bannedAt: new Date(), bannedById: actor.id, bannedByName: actor.name },
  });
  await logAction(actor, "player_banned", "account", input.accountId, input.reason);
}

export async function unbanAccount(actor: AdminActor, accountId: string): Promise<void> {
  await prisma.ban.delete({ where: { userId: accountId } }).catch(() => undefined);
  await logAction(actor, "player_unbanned", "account", accountId, null);
}

export interface PlayerNoteRow {
  id: string;
  note: string;
  createdAt: string;
  authorName: string | null;
}

export async function listPlayerNotes(accountId: string): Promise<PlayerNoteRow[]> {
  const notes = await prisma.playerNote.findMany({ where: { userId: accountId }, orderBy: { createdAt: "desc" } });
  return notes.map((note) => ({
    id: note.id,
    note: note.note,
    createdAt: note.createdAt.toISOString(),
    authorName: note.authorName,
  }));
}

export async function addPlayerNote(actor: AdminActor, accountId: string, note: string): Promise<void> {
  await prisma.playerNote.create({ data: { userId: accountId, note, authorId: actor.id, authorName: actor.name } });
  await logAction(actor, "player_note_added", "account", accountId, null);
}

export type { PermissionCatalogEntry as PermissionCatalogRow };

export function listPermissionCatalog(): PermissionCatalogEntry[] {
  return PERMISSION_CATALOG;
}

export interface AccountPermissionRow {
  permission: string;
  source: "manual";
}

export async function listAccountPermissions(accountId: string): Promise<AccountPermissionRow[]> {
  const user = await prisma.user.findUnique({ where: { id: accountId }, select: { permissions: true } });
  return (user?.permissions ?? []).map((permission) => ({ permission, source: "manual" as const }));
}

export async function grantPermission(actor: AdminActor, accountId: string, permission: string): Promise<void> {
  if (!PERMISSION_CATALOG.some((entry) => entry.permission === permission)) {
    throw new Error(`Unknown permission: ${permission}`);
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: accountId }, select: { permissions: true } });
  if (!user.permissions.includes(permission)) {
    await prisma.user.update({ where: { id: accountId }, data: { permissions: { push: permission } } });
  }
  await logAction(actor, "permission_granted", "account", accountId, permission);
}

export async function revokePermission(actor: AdminActor, accountId: string, permission: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: accountId }, select: { permissions: true } });
  await prisma.user.update({
    where: { id: accountId },
    data: { permissions: user.permissions.filter((p) => p !== permission) },
  });
  await logAction(actor, "permission_revoked", "account", accountId, permission);
}

export interface StaffRosterRow {
  accountId: string;
  discordName: string | null;
  title: string;
  notes: string | null;
  appointedAt: string;
  appointedByName: string | null;
}

export async function listStaff(): Promise<StaffRosterRow[]> {
  const rows = await prisma.staffMember.findMany({ include: { user: true }, orderBy: { appointedAt: "asc" } });
  return rows.map((row) => ({
    accountId: row.userId,
    discordName: row.user.name,
    title: row.title,
    notes: row.notes,
    appointedAt: row.appointedAt.toISOString(),
    appointedByName: row.appointedByName,
  }));
}

export async function appointStaff(
  actor: AdminActor,
  input: { accountId: string; title: string; notes: string | null },
): Promise<void> {
  await prisma.staffMember.upsert({
    where: { userId: input.accountId },
    create: {
      userId: input.accountId,
      title: input.title,
      notes: input.notes,
      appointedById: actor.id,
      appointedByName: actor.name,
    },
    update: { title: input.title, notes: input.notes, appointedAt: new Date(), appointedById: actor.id, appointedByName: actor.name },
  });
  await prisma.user.update({ where: { id: input.accountId }, data: { isStaff: true } });
  await logAction(actor, "staff_appointed", "account", input.accountId, input.title);
}

export async function updateStaff(
  actor: AdminActor,
  accountId: string,
  input: { title: string; notes: string | null },
): Promise<void> {
  await prisma.staffMember.update({ where: { userId: accountId }, data: { title: input.title, notes: input.notes } });
  await logAction(actor, "staff_updated", "account", accountId, input.title);
}

export async function removeStaff(actor: AdminActor, accountId: string): Promise<void> {
  await prisma.staffMember.delete({ where: { userId: accountId } }).catch(() => undefined);

  const user = await prisma.user.findUnique({ where: { id: accountId }, select: { permissions: true } });
  const revoked = user?.permissions.filter((p) => p.startsWith("fmrp.staff.")) ?? [];
  if (user) {
    await prisma.user.update({
      where: { id: accountId },
      data: { isStaff: false, permissions: user.permissions.filter((p) => !p.startsWith("fmrp.staff.")) },
    });
  }
  await logAction(
    actor,
    "staff_removed",
    "account",
    accountId,
    revoked.length > 0 ? `revoked: ${revoked.join(", ")}` : null,
  );
}

export interface StaffActionRow {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: string;
  actorName: string | null;
}

export async function listStaffActions(limit = 100): Promise<StaffActionRow[]> {
  const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    details: row.details,
    createdAt: row.createdAt.toISOString(),
    actorName: row.actorName,
  }));
}

export interface ApplicationReviewRow {
  id: string;
  discordId: string;
  discordUsername: string;
  department: DepartmentCode;
  answers: Record<string, string>;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedByName: string | null;
}

export async function countApplicationsByStatus(): Promise<Record<ApplicationStatus, number>> {
  const groups = await prisma.application.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<ApplicationStatus, number> = {
    pending: 0,
    interview_scheduled: 0,
    interview_completed: 0,
    awaiting_final_decision: 0,
    accepted: 0,
    rejected: 0,
  };
  for (const group of groups) {
    counts[group.status] = group._count._all;
  }
  return counts;
}

export async function listApplications(status?: ApplicationStatus): Promise<ApplicationReviewRow[]> {
  const rows = await prisma.application.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    discordId: row.discordId,
    discordUsername: row.discordUsername,
    department: row.department as DepartmentCode,
    answers: row.answers as Record<string, string>,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewedByName: row.reviewedByName,
  }));
}

export async function updateApplicationStatus(
  actor: AdminActor,
  id: string,
  status: "pending" | "interview_scheduled" | "interview_completed" | "awaiting_final_decision" | "accepted" | "rejected",
  details?: { interviewDate?: string | null; notes?: string | null },
): Promise<void> {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    throw new Error(`Application not found: ${id}`);
  }

  const answers = (application.answers as Record<string, unknown> | null) ?? {};
  const nextAnswers = { ...answers } as Record<string, unknown>;

  if (details?.interviewDate) {
    nextAnswers.interviewDate = details.interviewDate;
  }
  if (details?.notes) {
    nextAnswers.interviewNotes = details.notes;
  }
  if (status === "interview_completed") {
    nextAnswers.interviewCompletedAt = new Date().toISOString();
  }
  if (status === "awaiting_final_decision") {
    nextAnswers.awaitingFinalDecisionAt = new Date().toISOString();
  }
  if (status === "accepted" || status === "rejected") {
    nextAnswers.finalDecision = status;
    nextAnswers.finalDecisionAt = new Date().toISOString();
  }

  await prisma.application.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedById: actor.id,
      reviewedByName: actor.name,
      answers: nextAnswers as Prisma.InputJsonValue,
    },
  });

  const actionName =
    status === "interview_scheduled"
      ? "application_interview_scheduled"
      : status === "interview_completed"
        ? "application_interview_completed"
        : status === "awaiting_final_decision"
          ? "application_awaiting_final_decision"
          : status === "accepted"
            ? "application_accepted"
            : status === "rejected"
              ? "application_rejected"
              : "application_updated";

  await logAction(actor, actionName, "application", id, details?.interviewDate ?? null);
  await import("./discordBot").then(({ emitRecruitmentBotEvent }) => {
    const eventName =
      status === "interview_scheduled"
        ? "interview_scheduled"
        : status === "interview_completed"
          ? "interview_completed"
          : status === "awaiting_final_decision"
            ? "awaiting_final_decision"
            : status === "accepted"
              ? "application_accepted"
              : status === "rejected"
                ? "application_rejected"
                : "application_submitted";

    return emitRecruitmentBotEvent(eventName as any, {
      discordId: application.discordId,
      discordUsername: application.discordUsername,
      department: application.department,
      interviewDate: details?.interviewDate ?? null,
      message: details?.notes ?? "",
      accepted: status === "accepted",
    });
  });
}
