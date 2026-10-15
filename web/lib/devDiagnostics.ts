// Read-only diagnostics behind the Dev Dashboard (/admin/dev). Every check
// catches its own failures and reports them as data, so one broken dependency
// (no database, bot offline) never takes the whole dashboard down with it.
// Secret values are never returned - only whether they're set.
import { readdir } from "node:fs/promises";
import path from "node:path";
import nextPackage from "next/package.json";
import { prisma } from "./prisma";
import { DEV_AUTH_BYPASSED } from "./session";
import { discordBotBaseUrl, discordBotSecret } from "./discordBot";

export type CheckStatus = "ok" | "warning" | "error" | "info";

export interface RuntimeInfo {
  nodeEnv: string;
  deployment: string;
  region: string | null;
  nodeVersion: string;
  nextVersion: string;
  commitSha: string | null;
  commitRef: string | null;
  commitMessage: string | null;
  uptimeSeconds: number;
  memoryMb: number;
  devAuthBypassed: boolean;
}

export function getRuntimeInfo(): RuntimeInfo {
  return {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    deployment: process.env.VERCEL_ENV ?? (process.env.VERCEL ? "vercel" : "self-hosted / local"),
    region: process.env.VERCEL_REGION ?? null,
    nodeVersion: process.version,
    nextVersion: nextPackage.version,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    commitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    devAuthBypassed: DEV_AUTH_BYPASSED,
  };
}

export interface ConfigCheck {
  name: string;
  purpose: string;
  status: CheckStatus;
  // Only ever a non-secret value (a URL, a hostname, a count) or a hint.
  detail: string;
}

function isSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function databaseHost(): string {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    return `${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "not a valid URL";
  }
}

export function getConfigChecks(): ConfigCheck[] {
  const production = process.env.NODE_ENV === "production";
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? "";
  const bootstrapIds = (process.env.ADMIN_BOOTSTRAP_DISCORD_IDS ?? "").split(",").filter((id) => id.trim());
  const decisionConfigured = isSet("DECISION_BOARD_USER_ID") || isSet("DECISION_BOARD_DISCORD_NAME");
  const missingStatus: CheckStatus = DEV_AUTH_BYPASSED ? "info" : "error";

  return [
    {
      name: "DATABASE_URL",
      purpose: "Postgres connection string for every account, application and doc.",
      status: isSet("DATABASE_URL") ? "ok" : missingStatus,
      detail: isSet("DATABASE_URL") ? databaseHost() : "Not set",
    },
    {
      name: "NEXTAUTH_SECRET",
      purpose: "Signs session cookies.",
      status: !secret ? missingStatus : secret === "change-me" || secret.length < 32 ? "warning" : "ok",
      detail: !secret
        ? "Not set"
        : secret === "change-me"
          ? "Still the .env.example placeholder"
          : secret.length < 32
            ? `Set, but short (${secret.length} chars). Use openssl rand -base64 32`
            : "Set",
    },
    {
      name: "NEXTAUTH_URL",
      purpose: "Public URL of the site, used for OAuth redirects.",
      status: !nextAuthUrl ? (production ? "error" : "info") : production && /localhost|127\.0\.0\.1/.test(nextAuthUrl) ? "warning" : "ok",
      detail: nextAuthUrl || "Not set (inferred from the request in dev)",
    },
    {
      name: "DISCORD_CLIENT_ID / SECRET",
      purpose: "Discord OAuth app used for sign-in.",
      status: isSet("DISCORD_CLIENT_ID") && isSet("DISCORD_CLIENT_SECRET") ? "ok" : missingStatus,
      detail:
        isSet("DISCORD_CLIENT_ID") && isSet("DISCORD_CLIENT_SECRET")
          ? `Client ID ${process.env.DISCORD_CLIENT_ID}`
          : `Missing ${[!isSet("DISCORD_CLIENT_ID") && "client ID", !isSet("DISCORD_CLIENT_SECRET") && "client secret"].filter(Boolean).join(" and ")}`,
    },
    {
      name: "ADMIN_BOOTSTRAP_DISCORD_IDS",
      purpose: "Discord IDs that always get admin + developer on sign-in.",
      status: bootstrapIds.length > 0 ? "ok" : "info",
      detail: bootstrapIds.length > 0 ? `${bootstrapIds.length} id${bootstrapIds.length === 1 ? "" : "s"} listed` : "None. Admins are managed in the UI only",
    },
    {
      name: "DECISION_BOARD_USER_ID / DISCORD_NAME",
      purpose: "Which account may use the Department Decisions board.",
      status: decisionConfigured ? "ok" : "warning",
      detail: decisionConfigured ? "Configured" : "Not set. Nobody can make final decisions in production",
    },
    {
      name: "DISCORD_BOT_WEBHOOK_URL / SECRET",
      purpose: "Applicant DMs and acceptance roles through the Discord bot.",
      status: discordBotSecret() ? "ok" : "warning",
      detail: discordBotSecret() ? discordBotBaseUrl() : "No secret set, so bot notifications are disabled",
    },
    {
      name: "NEXT_PUBLIC_RECRUITMENT_DISCORD_URL",
      purpose: "Recruitment Discord invite shown on the public site.",
      status: isSet("NEXT_PUBLIC_RECRUITMENT_DISCORD_URL") ? "ok" : "warning",
      detail: process.env.NEXT_PUBLIC_RECRUITMENT_DISCORD_URL || "Not set",
    },
    {
      name: "DEV_BYPASS_AUTH",
      purpose: "Fake signed-in session for local UI work (never honored in production).",
      status: DEV_AUTH_BYPASSED ? "warning" : "ok",
      detail: DEV_AUTH_BYPASSED ? "Active: every visitor is the fake Dev User" : production ? "Ignored in production" : "Off",
    },
  ];
}

export interface TableCount {
  table: string;
  rows: number;
}

export interface MigrationRow {
  name: string;
  status: "applied" | "failed" | "rolled_back" | "pending";
  finishedAt: string | null;
}

export interface DatabaseDiagnostics {
  reachable: boolean;
  error: string | null;
  latencyMs: number | null;
  serverVersion: string | null;
  tables: TableCount[];
  migrations: MigrationRow[];
  // False when prisma/migrations isn't on disk (it's bundled for this route
  // via next.config.mjs), in which case pending migrations can't be shown.
  migrationFilesFound: boolean;
}

async function localMigrationNames(): Promise<string[] | null> {
  try {
    const entries = await readdir(path.join(process.cwd(), "prisma", "migrations"), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return null;
  }
}

function shortError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  // Prisma errors can be long and repeat the query - the last line names the cause.
  const lines = message.trim().split("\n").filter((line) => line.trim());
  return (lines[lines.length - 1] ?? message).slice(0, 300);
}

export async function getDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
  const localNames = await localMigrationNames();
  const empty: DatabaseDiagnostics = {
    reachable: false,
    error: null,
    latencyMs: null,
    serverVersion: null,
    tables: [],
    migrations: (localNames ?? []).map((name) => ({ name, status: "pending", finishedAt: null })),
    migrationFilesFound: localNames !== null,
  };

  if (!process.env.DATABASE_URL?.trim()) {
    return { ...empty, error: "DATABASE_URL is not set." };
  }

  let latencyMs: number;
  try {
    const started = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    latencyMs = Math.round(performance.now() - started);
  } catch (err) {
    return { ...empty, error: shortError(err) };
  }

  try {
    const [versionRows, applied, ...counts] = await Promise.all([
      prisma.$queryRaw<{ server_version: string }[]>`SHOW server_version`,
      prisma.$queryRaw<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]>`
        SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at
      `.catch(() => []),
      prisma.user.count(),
      prisma.application.count(),
      prisma.staffMember.count(),
      prisma.ban.count(),
      prisma.playerNote.count(),
      prisma.doc.count(),
      prisma.auditLog.count(),
      prisma.session.count(),
    ]);

    const tableNames = ["User", "Application", "StaffMember", "Ban", "PlayerNote", "Doc", "AuditLog", "Session"];
    const migrations: MigrationRow[] = applied.map((row) => ({
      name: row.migration_name,
      status: row.rolled_back_at ? "rolled_back" : row.finished_at ? "applied" : "failed",
      finishedAt: row.finished_at?.toISOString() ?? null,
    }));
    const appliedNames = new Set(migrations.map((row) => row.name));
    for (const name of localNames ?? []) {
      if (!appliedNames.has(name)) {
        migrations.push({ name, status: "pending", finishedAt: null });
      }
    }

    return {
      reachable: true,
      error: null,
      latencyMs,
      serverVersion: versionRows[0]?.server_version ?? null,
      tables: tableNames.map((table, index) => ({ table, rows: counts[index] ?? 0 })),
      migrations,
      migrationFilesFound: localNames !== null,
    };
  } catch (err) {
    // Connected, but a table is missing - almost always unapplied migrations.
    return { ...empty, reachable: true, latencyMs, error: shortError(err) };
  }
}

export interface BotDiagnostics {
  url: string;
  secretConfigured: boolean;
  reachable: boolean;
  discordReady: boolean | null;
  latencyMs: number | null;
  error: string | null;
}

export async function getBotDiagnostics(): Promise<BotDiagnostics> {
  const url = discordBotBaseUrl();
  const base = { url, secretConfigured: Boolean(discordBotSecret()) };
  const started = performance.now();
  try {
    const response = await fetch(`${url}/health`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    const latencyMs = Math.round(performance.now() - started);
    if (!response.ok) {
      // An older bot build without /health still proves the process is up.
      return { ...base, reachable: true, discordReady: null, latencyMs, error: `/health answered HTTP ${response.status}` };
    }
    const body = (await response.json().catch(() => null)) as { discordReady?: boolean } | null;
    return { ...base, reachable: true, discordReady: body?.discordReady ?? null, latencyMs, error: null };
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return {
      ...base,
      reachable: false,
      discordReady: null,
      latencyMs: null,
      error: timedOut ? "No response within 3 seconds" : shortError(err),
    };
  }
}
