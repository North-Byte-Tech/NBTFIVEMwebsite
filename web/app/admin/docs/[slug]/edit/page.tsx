import { notFound, redirect } from "next/navigation";
import { requireAdminActor } from "@/lib/requireAdmin";
import { DOC_CATEGORIES, getDoc } from "@/lib/docs";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocEditor } from "@/components/admin/DocEditor";

export const dynamic = "force-dynamic";

export default async function EditDocPage({ params }: { params: { slug: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return null;
  }

  const doc = await getDoc(params.slug);
  if (!doc) {
    notFound();
  }
  // Built-ins are edited in lib/builtinDocs.ts, not here.
  if (doc.builtin || !doc.id) {
    redirect(`/admin/docs/${doc.slug}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title="Edit Article" />
      <DocEditor
        categories={DOC_CATEGORIES}
        initial={{ id: doc.id, title: doc.title, category: doc.category, summary: doc.summary, body: doc.body, pinned: doc.pinned }}
      />
    </div>
  );
}
