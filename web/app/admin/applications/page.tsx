import Link from "next/link";
import { requireAdminActor } from "@/lib/requireAdmin";
import { listApplications } from "@/lib/adminData";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApplicationsQueue } from "@/components/admin/ApplicationsQueue";
import type { ApplicationStatus } from "@/lib/applications";

const TABS: { status: ApplicationStatus; label: string }[] = [
  { status: "pending", label: "Submitted" },
  { status: "interview_scheduled", label: "Interview Scheduled" },
  { status: "interview_completed", label: "Interview Completed" },
  { status: "awaiting_final_decision", label: "Awaiting Final Decision" },
  { status: "accepted", label: "Accepted" },
  { status: "rejected", label: "Rejected" },
];

export default async function AdminApplicationsPage({ searchParams }: { searchParams: { status?: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return null;
  }

  const status = (searchParams.status as ApplicationStatus | undefined) ?? "pending";
  const applications = await listApplications(status);

  return (
    <div className="space-y-8">
      <PageHeader title="Recruitment Applications" />
      <div className="flex gap-4 text-sm">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={`/admin/applications?status=${tab.status}`}
            className={tab.status === status ? "font-semibold text-trooper-400" : "text-muted hover:text-bone"}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <ApplicationsQueue applications={applications} showActions={["pending", "interview_scheduled", "interview_completed", "awaiting_final_decision"].includes(status)} />
    </div>
  );
}
