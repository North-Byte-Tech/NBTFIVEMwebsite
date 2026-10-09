"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  DEFAULT_APPLICATION_TYPES,
  getStoredApplicationTypes,
  saveStoredApplicationTypes,
  type ApplicationTypeDefinition,
} from "@/lib/applicationTypes";
import type { ApplicationReviewRow } from "@/lib/adminData";

export function DepartmentDecisionBoard({
  pendingApplications,
  acceptedApplications,
}: {
  pendingApplications: ApplicationReviewRow[];
  acceptedApplications: ApplicationReviewRow[];
}) {
  const initialTypes = useMemo(() => getStoredApplicationTypes(), []);
  const [types, setTypes] = useState<ApplicationTypeDefinition[]>(initialTypes);

  function toggleDepartment(typeId: string) {
    const next = types.map((type) =>
      type.id === typeId ? { ...type, active: !type.active } : type,
    );
    setTypes(next);
    saveStoredApplicationTypes(next);
    window.dispatchEvent(new Event("nbt-form-builder-updated"));
  }

  const pendingByDepartment = pendingApplications.reduce<Record<string, number>>((acc, app) => {
    acc[app.department] = (acc[app.department] ?? 0) + 1;
    return acc;
  }, {});

  const acceptedByDepartment = acceptedApplications.reduce<Record<string, number>>((acc, app) => {
    acc[app.department] = (acc[app.department] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {types.map((type) => {
        const pendingCount = pendingByDepartment[type.department] ?? 0;
        const acceptedCount = acceptedByDepartment[type.department] ?? 0;

        return (
          <Card key={type.id} padded={false} className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-line bg-[#171b12] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-steel">{type.department}</p>
                <h3 className="mt-1 text-2xl text-bone">{type.name}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    type.active
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : "border-line bg-surface text-muted",
                  ].join(" ")}
                >
                  {type.active ? "Open for applications" : "Closed"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleDepartment(type.id)}
                  className={buttonClasses(type.active ? "secondary" : "primary")}
                >
                  {type.active ? "Close department" : "Open department"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Pending</p>
                <p className="mt-2 text-3xl text-bone">{pendingCount}</p>
                <p className="mt-1 text-sm text-muted">Applications waiting review</p>
              </div>

              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Accepted</p>
                <p className="mt-2 text-3xl text-bone">{acceptedCount}</p>
                <p className="mt-1 text-sm text-muted">Applicants already approved</p>
              </div>

              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Status</p>
                <p className="mt-2 text-lg text-bone">{type.active ? "Recruiting" : "Paused"}</p>
                <p className="mt-1 text-sm text-muted">Visible to the public site</p>
              </div>
            </div>

            <div className="border-t border-line p-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-lg text-bone">Final review queue</h4>
                <Link href="/admin/applications?status=pending" className="text-sm text-trooper-400 hover:underline">
                  View all applications
                </Link>
              </div>

              {pendingCount === 0 ? (
                <p className="mt-3 text-sm text-muted">No pending applications for this department.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {pendingApplications
                    .filter((application) => application.department === type.department)
                    .slice(0, 3)
                    .map((application) => (
                      <div key={application.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-[#121610] px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-bone">{application.discordUsername}</p>
                          <p className="text-xs text-muted">{new Date(application.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Link href="/admin/applications?status=pending" className="text-sm text-trooper-400 hover:underline">
                          Review
                        </Link>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
