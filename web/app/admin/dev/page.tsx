import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, Bot, Database, KeyRound, Server, Terminal, UserRound } from "lucide-react";
import { requireDeveloperActor } from "@/lib/requireAdmin";
import { getSession } from "@/lib/session";
import { DEVELOPER_PERMISSION } from "@/lib/permissions";
import {
  getBotDiagnostics,
  getConfigChecks,
  getDatabaseDiagnostics,
  getRuntimeInfo,
  type CheckStatus,
} from "@/lib/devDiagnostics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

// Diagnostics must reflect this request, never a cached render.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<CheckStatus, { dot: string; text: string; label: string }> = {
  ok: { dot: "bg-emerald-400", text: "text-emerald-300", label: "OK" },
  warning: { dot: "bg-amber-400", text: "text-amber-300", label: "Check" },
  error: { dot: "bg-red-400", text: "text-red-300", label: "Missing" },
  info: { dot: "bg-steel-600", text: "text-muted", label: "Info" },
};

function StatusDot({ status, label }: { status: CheckStatus; label?: string }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${style.text}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
      {label ?? style.label}
    </span>
  );
}

function Section({ icon, title, aside, children }: { icon: ReactNode; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <Card className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg text-bone">
          <span className="text-trooper-300">{icon}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </Card>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="min-w-0 break-words text-bone [&_code]:break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days && `${days}d`, (days || hours) && `${hours}h`, `${minutes}m`].filter(Boolean).join(" ");
}

const DEV_COMMANDS = [
  { label: "Run the site locally", command: "pnpm --filter fmrp-web dev" },
  { label: "Create a migration", command: "pnpm --filter fmrp-web exec prisma migrate dev --name <change>" },
  { label: "Apply migrations (prod)", command: "pnpm --filter fmrp-web exec prisma migrate deploy" },
  { label: "Browse the database", command: "pnpm --filter fmrp-web exec prisma studio" },
  { label: "Run the Discord bot", command: "pnpm --filter fmrp-discord-bot dev" },
];

export default async function DevDashboardPage() {
  const actor = await requireDeveloperActor();
  if (actor === null) {
    return (
      <Card className="mx-auto max-w-md text-center text-sm text-muted">
        The Dev Dashboard needs the <code className="text-trooper-300">{DEVELOPER_PERMISSION}</code> permission.
      </Card>
    );
  }

  const runtime = getRuntimeInfo();
  const config = getConfigChecks();
  const [database, bot, session] = await Promise.all([getDatabaseDiagnostics(), getBotDiagnostics(), getSession()]);

  const pendingMigrations = database.migrations.filter((row) => row.status === "pending").length;
  const failedMigrations = database.migrations.filter((row) => row.status === "failed").length;
  const configProblems = config.filter((check) => check.status === "error" || check.status === "warning").length;

  const databaseStatus: CheckStatus = !database.reachable || failedMigrations > 0 ? "error" : database.error || pendingMigrations > 0 ? "warning" : "ok";
  const botStatus: CheckStatus = !bot.secretConfigured && !bot.reachable ? "info" : !bot.reachable ? "error" : bot.discordReady === false ? "warning" : "ok";
  const configStatus: CheckStatus = config.some((check) => check.status === "error") ? "error" : configProblems > 0 ? "warning" : "ok";

  const summary = [
    {
      label: "Database",
      status: databaseStatus,
      value: database.reachable ? `${database.latencyMs} ms` : "Unreachable",
      hint: pendingMigrations > 0 ? `${pendingMigrations} pending migration${pendingMigrations === 1 ? "" : "s"}` : database.serverVersion ? `Postgres ${database.serverVersion}` : database.error ?? "",
    },
    {
      label: "Discord bot",
      status: botStatus,
      value: bot.reachable ? (bot.discordReady === false ? "Not logged in" : "Online") : "Offline",
      hint: bot.reachable && bot.latencyMs !== null ? `${bot.latencyMs} ms` : bot.secretConfigured ? "Notifications will fail" : "Notifications disabled",
    },
    {
      label: "Configuration",
      status: configStatus,
      value: configProblems === 0 ? "All set" : `${configProblems} to review`,
      hint: `${config.length} checks`,
    },
    {
      label: "Build",
      status: "info" as CheckStatus,
      value: runtime.commitSha ? runtime.commitSha.slice(0, 7) : runtime.nodeEnv,
      hint: runtime.commitRef ?? runtime.deployment,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dev Dashboard">
        Live runtime, configuration and database diagnostics for this deployment. Values are read on every load, and
        secrets are never displayed.
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted">{item.label}</p>
              {item.status !== "info" && <StatusDot status={item.status} />}
            </div>
            <p className="font-display text-2xl tracking-wide text-bone">{item.value}</p>
            <p className="truncate text-xs text-muted" title={item.hint}>
              {item.hint}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section icon={<Server className="h-5 w-5" />} title="Runtime">
          <Facts
            rows={[
              ["Environment", `${runtime.nodeEnv} · ${runtime.deployment}${runtime.region ? ` (${runtime.region})` : ""}`],
              ["Next.js", runtime.nextVersion],
              ["Node.js", runtime.nodeVersion],
              ["Commit", runtime.commitSha ? <code key="sha" className="text-trooper-300">{runtime.commitSha.slice(0, 12)}</code> : "Not reported (local build)"],
              ["Branch", runtime.commitRef ?? "Not reported"],
              ["Commit message", runtime.commitMessage ?? "Not reported"],
              ["Instance uptime", formatUptime(runtime.uptimeSeconds)],
              ["Memory (RSS)", `${runtime.memoryMb} MB`],
            ]}
          />
        </Section>

        <Section
          icon={<Bot className="h-5 w-5" />}
          title="Discord bot"
          aside={<StatusDot status={botStatus} label={summary[1]?.value} />}
        >
          <Facts
            rows={[
              ["Endpoint", <code key="url" className="text-trooper-300">{bot.url}/health</code>],
              ["Shared secret", bot.secretConfigured ? "Configured" : "Not set. The site won't send notifications"],
              ["Reachable", bot.reachable ? `Yes (${bot.latencyMs} ms)` : "No"],
              ["Logged in to Discord", bot.discordReady === null ? "Unknown" : bot.discordReady ? "Yes" : "No"],
              ...(bot.error ? ([["Last error", <span key="err" className="text-red-300">{bot.error}</span>]] as [string, ReactNode][]) : []),
            ]}
          />
        </Section>
      </div>

      <Section
        icon={<Database className="h-5 w-5" />}
        title="Database"
        aside={<StatusDot status={databaseStatus} label={database.reachable ? "Connected" : "Unreachable"} />}
      >
        {database.error && (
          <p className="rounded-md border border-red-800/40 bg-red-900/20 px-4 py-2 font-mono text-xs text-red-300">{database.error}</p>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-3">
            <h3 className="text-sm uppercase tracking-[0.18em] text-muted">Tables</h3>
            {database.tables.length > 0 ? (
              <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                {database.tables.map((row) => (
                  <li key={row.table} className="flex items-center justify-between px-3 py-2">
                    <span className="font-mono text-steel">{row.table}</span>
                    <span className="tabular-nums text-bone">{row.rows.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Row counts appear once the database is reachable and migrated.</p>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm uppercase tracking-[0.18em] text-muted">Migrations</h3>
            {database.migrations.length > 0 ? (
              <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                {database.migrations.map((row) => (
                  <li key={row.name} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="min-w-0 break-all font-mono text-xs text-steel">{row.name}</span>
                    <StatusDot
                      status={row.status === "applied" ? "ok" : row.status === "pending" ? "warning" : "error"}
                      label={row.status.replace("_", " ")}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No migration history found.</p>
            )}
            {!database.migrationFilesFound && (
              <p className="text-xs text-muted">Migration files aren&apos;t bundled with this deployment, so pending migrations can&apos;t be detected.</p>
            )}
            {pendingMigrations > 0 && (
              <p className="text-xs text-amber-300">
                Run <code>prisma migrate deploy</code> against this database to apply pending migrations.
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section
        icon={<KeyRound className="h-5 w-5" />}
        title="Configuration"
        aside={<StatusDot status={configStatus} label={configProblems === 0 ? "All set" : `${configProblems} to review`} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-2 pr-4 font-medium">Variable</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {config.map((check) => (
                <tr key={check.name} className="align-top">
                  <td className="py-2.5 pr-4">
                    <p className="font-mono text-xs text-bone">{check.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{check.purpose}</p>
                  </td>
                  <td className="py-2.5 pr-4">
                    <StatusDot status={check.status} />
                  </td>
                  <td className="break-all py-2.5 text-steel">{check.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section icon={<UserRound className="h-5 w-5" />} title="Your session">
          <Facts
            rows={[
              ["Name", session?.user?.name ?? "Unknown"],
              ["Account ID", <code key="id" className="text-trooper-300">{session?.userId ?? "—"}</code>],
              ["Discord ID", session?.discordId ?? "—"],
              ["Staff", session?.isStaff ? "Yes" : "No"],
              [
                "Permissions",
                <span key="perms" className="flex flex-wrap gap-1.5">
                  {(session?.permissions ?? []).map((permission) => (
                    <code key={permission} className="rounded bg-surface-raised px-1.5 py-0.5 text-xs text-steel">
                      {permission}
                    </code>
                  ))}
                </span>,
              ],
            ]}
          />
        </Section>

        <Section icon={<Terminal className="h-5 w-5" />} title="Developer commands">
          <ul className="space-y-3 text-sm">
            {DEV_COMMANDS.map((item) => (
              <li key={item.label}>
                <p className="text-muted">{item.label}</p>
                <code className="mt-1 block overflow-x-auto whitespace-nowrap rounded-md border border-line bg-ink px-3 py-2 font-mono text-xs text-bone">
                  {item.command}
                </code>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Activity className="h-3.5 w-3.5" />
            More in the{" "}
            <Link href="/admin/docs/developer-setup" className="text-trooper-300 hover:text-bone">
              Developer setup
            </Link>{" "}
            article.
          </p>
        </Section>
      </div>
    </div>
  );
}
