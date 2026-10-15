import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireAdminActor } from "@/lib/requireAdmin";
import { getDoc } from "@/lib/docs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Markdown } from "@/components/docs/Markdown";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: { slug: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return null;
  }

  const doc = await getDoc(params.slug);
  if (!doc) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/docs" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-bone">
        <ArrowLeft className="h-4 w-4" /> Doc Center
      </Link>

      <header className="page-heading">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/docs?category=${encodeURIComponent(doc.category)}`}
            className="page-heading__eyebrow hover:text-bone"
          >
            {doc.category}
          </Link>
          {doc.builtin && <Badge>Built-in</Badge>}
          {doc.pinned && <Badge tone="warning">Pinned</Badge>}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-4xl text-bone">{doc.title}</h1>
          {!doc.builtin && (
            <Link href={`/admin/docs/${doc.slug}/edit`} className={buttonClasses("secondary", "shrink-0")}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          )}
        </div>
        {doc.summary && <p className="text-muted">{doc.summary}</p>}
        <p className="text-xs text-muted">
          {doc.builtin
            ? "Ships with the website code and updates when it changes."
            : `Last updated ${new Date(doc.updatedAt!).toLocaleString()}${doc.updatedByName ? ` by ${doc.updatedByName}` : ""}${
                doc.createdByName && doc.createdByName !== doc.updatedByName ? ` · written by ${doc.createdByName}` : ""
              }`}
        </p>
      </header>

      <Card className="sm:p-8">
        <Markdown>{doc.body}</Markdown>
      </Card>
    </article>
  );
}
