import type { ReactNode } from "react";
import { requireAdminActor, requireDeveloperActor, requireFinalDecisionActor } from "@/lib/requireAdmin";
import { Card } from "@/components/ui/Card";
import { AdminNav } from "@/components/admin/AdminNav";

// The one admin gate - see lib/requireAdmin.ts.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const actor = await requireAdminActor();

  if (actor === null) {
    return (
      <Card className="mx-auto max-w-md text-center text-sm text-muted">
        You don&apos;t have access to the admin dashboard.
      </Card>
    );
  }

  const [decisionActor, developerActor] = await Promise.all([requireFinalDecisionActor(), requireDeveloperActor()]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <aside className="border-b border-line pb-3 lg:sticky lg:top-24 lg:w-56 lg:shrink-0 lg:self-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
        <div className="mb-4 hidden px-3 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-trooper-300">Staff Panel</p>
          <p className="mt-1 truncate text-sm text-bone">{actor.name ?? "Staff member"}</p>
        </div>
        <AdminNav canDecide={decisionActor !== null} isDeveloper={developerActor !== null} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
