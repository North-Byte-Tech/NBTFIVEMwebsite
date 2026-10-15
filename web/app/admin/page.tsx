import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, Gavel, ShieldCheck, UserX } from "lucide-react";
import type { ApplicationStatus } from "@prisma/client";
import { requireAdminActor, requireFinalDecisionActor } from "@/lib/requireAdmin";
import { countApplicationsByStatus, listApplications, listBans, listStaff, listStaffActions } from "@/lib/adminData";
import { countDocs } from "@/lib/docs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const PIPELINE: { status: ApplicationStatus; label: string; bar: string }[] = [
  { status: "pending", label: "Pending review", bar: "bg-steel-600" },
  { status: "interview_scheduled", label: "Interview scheduled", bar: "bg-trooper-400" },
  { status: "interview_completed", label: "Interview completed", bar: "bg-trooper-500" },
  { status: "awaiting_final_decision", label: "Awaiting decision", bar: "bg-gold-500" },
  { status: "accepted", label: "Accepted", bar: "bg-emerald-500" },
  { status: "rejected", label: "Rejected", bar: "bg-red-500/80" },
];

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  pending: "neutral",
  interview_scheduled: "warning",
  interview_completed: "warning",
  awaiting_final_decision: "warning",
  accepted: "success",
  rejected: "danger",
};

function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

function humanizeAction(action: string): string {
  const text = action.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function AdminOverviewPage() {
  const actor = await requireAdminActor();
  if (actor === null) {
    // Unreachable in practice - app/admin/layout.tsx already gates this
    // whole route segment before this page's body ever runs.
    return null;
  }

  const [counts, recentApplications, bans, staff, activity, docCount, decisionActor] = await Promise.all([
    countApplicationsByStatus(),
    listApplications().then((rows) => rows.slice(0, 6)),
    listBans(),
    listStaff(),
    listStaffActions(8),
    countDocs(),
    requireFinalDecisionActor(),
  ]);

  const inPipeline = counts.interview_scheduled + counts.interview_completed + counts.awaiting_final_decision;
  const totalApplications = PIPELINE.reduce((sum, stage) => sum + counts[stage.status], 0);

  const stats = [
    { label: "Pending review", value: counts.pending, href: "/admin/applications", icon: ClipboardList },
    { label: "In interview pipeline", value: inPipeline, href: "/admin/applications", icon: Gavel },
    { label: "Active bans", value: bans.length, href: "/admin/accounts", icon: UserX },
    { label: "Staff members", value: staff.length, href: "/admin/staff", icon: ShieldCheck },
    { label: "Doc Center articles", value: docCount, href: "/admin/docs", icon: BookOpen },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Admin Dashboard">
        Welcome back{actor.name ? `, ${actor.name}` : ""}. Here&apos;s what needs attention.
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="group">
              <Card className="h-full transition-colors group-hover:border-trooper-600/60">
                <Icon className="h-5 w-5 text-trooper-300" aria-hidden />
                <p className="mt-3 font-display text-3xl tracking-wide text-bone">{stat.value}</p>
                <p className="mt-1 text-sm text-muted">{stat.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg text-bone">Application pipeline</h2>
            <p className="text-sm text-muted">{totalApplications} total</p>
          </div>
          {totalApplications > 0 && (
            <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-raised" aria-hidden>
              {PIPELINE.map((stage) =>
                counts[stage.status] > 0 ? (
                  <div
                    key={stage.status}
                    className={stage.bar}
                    style={{ width: `${(counts[stage.status] / totalApplications) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
          )}
          <ul className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
            {PIPELINE.map((stage) => (
              <li key={stage.status} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-steel">
                  <span className={`h-2.5 w-2.5 rounded-sm ${stage.bar}`} aria-hidden />
                  {stage.label}
                </span>
                <span className="tabular-nums text-bone">{counts[stage.status]}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 border-t border-line pt-4 text-sm">
            <Link href="/admin/applications" className="inline-flex items-center gap-1.5 font-semibold text-trooper-300 hover:text-bone">
              Review applications <ArrowRight className="h-4 w-4" />
            </Link>
            {decisionActor && counts.awaiting_final_decision > 0 && (
              <Link href="/admin/department-decisions" className="inline-flex items-center gap-1.5 font-semibold text-gold-400 hover:text-bone">
                {counts.awaiting_final_decision} awaiting your decision <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg text-bone">Recent activity</h2>
            <Link href="/admin/audit-log" className="text-sm text-trooper-300 hover:text-bone">
              Audit log
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">No staff actions recorded yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-bone">{humanizeAction(entry.action)}</p>
                    <p className="truncate text-xs text-muted">
                      {entry.actorName ?? "unknown"}
                      {entry.details ? ` · ${entry.details}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{relativeTime(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-bone">Latest applications</h2>
          <Link href="/admin/applications" className="text-sm text-trooper-300 hover:text-bone">
            View all
          </Link>
        </div>
        {recentApplications.length === 0 ? (
          <p className="text-sm text-muted">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Applicant</th>
                  <th className="pb-2 pr-4 font-medium">Department</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentApplications.map((application) => (
                  <tr key={application.id}>
                    <td className="py-2.5 pr-4 text-bone">{application.discordUsername}</td>
                    <td className="py-2.5 pr-4 text-steel">{application.department}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={STATUS_TONE[application.status]}>{application.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="py-2.5 text-muted">{relativeTime(application.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
