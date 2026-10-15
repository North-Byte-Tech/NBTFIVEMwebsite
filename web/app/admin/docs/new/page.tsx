import { requireAdminActor } from "@/lib/requireAdmin";
import { DOC_CATEGORIES } from "@/lib/docs";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocEditor } from "@/components/admin/DocEditor";

export default async function NewDocPage() {
  const actor = await requireAdminActor();
  if (actor === null) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="New Article" />
      <DocEditor categories={DOC_CATEGORIES} />
    </div>
  );
}
