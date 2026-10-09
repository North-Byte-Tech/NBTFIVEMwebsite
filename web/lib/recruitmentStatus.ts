export const APPLICATION_STATUS_FLOW = [
  "pending",
  "interview_scheduled",
  "interview_completed",
  "awaiting_final_decision",
  "accepted",
  "rejected",
] as const;

export type RecruitmentStatus = (typeof APPLICATION_STATUS_FLOW)[number];

export function normalizeApplicationStatus(status?: string | null): RecruitmentStatus {
  const candidate = (status ?? "pending").trim();

  if (candidate === "submitted") {
    return "pending";
  }

  return APPLICATION_STATUS_FLOW.includes(candidate as RecruitmentStatus)
    ? (candidate as RecruitmentStatus)
    : "pending";
}

export function getApplicationStatusLabel(status?: string | null): string {
  switch (normalizeApplicationStatus(status)) {
    case "pending":
      return "Submitted";
    case "interview_scheduled":
      return "Interview Scheduled";
    case "interview_completed":
      return "Interview Completed";
    case "awaiting_final_decision":
      return "Awaiting Final Decision";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return "Submitted";
  }
}

export function getApplicationStatusTone(status?: string | null): "neutral" | "warning" | "success" | "danger" {
  switch (normalizeApplicationStatus(status)) {
    case "pending":
      return "warning";
    case "interview_scheduled":
      return "neutral";
    case "interview_completed":
      return "neutral";
    case "awaiting_final_decision":
      return "warning";
    case "accepted":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "warning";
  }
}
