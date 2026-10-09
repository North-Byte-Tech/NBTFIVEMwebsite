"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { getApplicationStatusLabel } from "@/lib/recruitmentStatus";
import type { ApplicationReviewRow } from "@/lib/adminData";

export function ApplicationsQueue({
  applications,
  showActions,
}: {
  applications: ApplicationReviewRow[];
  showActions: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function handleReview(id: string, status: "pending" | "interview_scheduled" | "interview_completed" | "awaiting_final_decision" | "accepted" | "rejected", interviewDate?: string) {
    setPending(id);
    try {
      await fetch(`/api/admin/applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, interviewDate, notes: interviewDate ? `Interview scheduled for ${interviewDate}` : undefined }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  if (applications.length === 0) {
    return <Card className="text-sm text-muted">No applications here.</Card>;
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-bone">
                {application.department} — {application.discordUsername}
              </p>
              <p className="text-xs text-muted">Submitted {new Date(application.createdAt).toLocaleString()}</p>
              <p className="text-xs text-muted">Status: {getApplicationStatusLabel(application.status)}</p>
            </div>
            {showActions && (
              <div className="flex flex-wrap gap-2">
                {application.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        const date = window.prompt("Interview date/time for this applicant:", new Date(Date.now() + 3600000).toISOString().slice(0, 16));
                        if (date) {
                          void handleReview(application.id, "interview_scheduled", date);
                        }
                      }}
                      disabled={pending === application.id}
                      className={buttonClasses("primary")}
                    >
                      Schedule Interview
                    </button>
                    <button
                      onClick={() => handleReview(application.id, "rejected")}
                      disabled={pending === application.id}
                      className={buttonClasses("secondary")}
                    >
                      Reject
                    </button>
                  </>
                )}

                {application.status === "interview_scheduled" && (
                  <>
                    <button
                      onClick={() => handleReview(application.id, "interview_completed")}
                      disabled={pending === application.id}
                      className={buttonClasses("primary")}
                    >
                      Mark Interview Complete
                    </button>
                    <button
                      onClick={() => handleReview(application.id, "rejected")}
                      disabled={pending === application.id}
                      className={buttonClasses("secondary")}
                    >
                      Reject
                    </button>
                  </>
                )}

                {application.status === "interview_completed" && (
                  <button
                    onClick={() => handleReview(application.id, "awaiting_final_decision")}
                    disabled={pending === application.id}
                    className={buttonClasses("primary")}
                  >
                    Send for Final Decision
                  </button>
                )}

                {application.status === "awaiting_final_decision" && (
                  <>
                    <button
                      onClick={() => handleReview(application.id, "accepted")}
                      disabled={pending === application.id}
                      className={buttonClasses("primary")}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReview(application.id, "rejected")}
                      disabled={pending === application.id}
                      className={buttonClasses("secondary")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            {Object.entries(application.answers).map(([question, answer]) => (
              <div key={question}>
                <dt className="text-xs uppercase text-muted">{question}</dt>
                <dd className="text-bone">{answer}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
    </div>
  );
}
