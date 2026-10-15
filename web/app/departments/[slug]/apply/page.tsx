import { notFound } from "next/navigation";
import { getSession, isAuthBypassHost } from "@/lib/session";
import { getDepartmentBySlug } from "@/lib/departments";
import { ApplicationForm } from "@/components/ApplicationForm";
import { AuthButton } from "@/components/AuthButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

// Reachable by direct link even when the application type is inactive, so
// staff can exercise the full submission flow before advertising it.
export default async function ApplyPage({ params }: { params: { slug: string } }) {
  const department = getDepartmentBySlug(params.slug);
  if (!department) {
    notFound();
  }

  const session = await getSession();
  // Guests on a no-login host have no Discord account to apply with - the
  // API would refuse their submission, so don't offer the form.
  const loginDisabled = isAuthBypassHost();
  const canApply = Boolean(session) && !loginDisabled;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title={`Apply — ${department.name}`} />
      {canApply ? (
        <ApplicationForm departmentCode={department.code} />
      ) : loginDisabled ? (
        <Card className="text-center text-sm text-muted">Applications can&apos;t be submitted on this site.</Card>
      ) : (
        <Card className="space-y-4 text-center">
          <p className="text-sm text-muted">Sign in with Discord to apply.</p>
          <div className="flex justify-center">
            <AuthButton signedIn={Boolean(session)} />
          </div>
        </Card>
      )}
    </div>
  );
}
