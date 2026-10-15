import Link from "next/link";
import { BookOpen, Pin, Plus, Search } from "lucide-react";
import { requireAdminActor } from "@/lib/requireAdmin";
import { DOC_CATEGORIES, listDocs, type DocSummary } from "@/lib/docs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

function docHref(filters: { q?: string; category?: string }): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  const qs = params.toString();
  return qs ? `/admin/docs?${qs}` : "/admin/docs";
}

function DocCard({ doc }: { doc: DocSummary }) {
  return (
    <Link href={`/admin/docs/${doc.slug}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-trooper-600/60">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-trooper-300">{doc.category}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {doc.pinned && <Pin className="h-3.5 w-3.5 text-gold-400" aria-label="Pinned" />}
            {doc.builtin && <Badge>Built-in</Badge>}
          </div>
        </div>
        <h3 className="mt-2 text-lg text-bone group-hover:text-trooper-300">{doc.title}</h3>
        {doc.summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{doc.summary}</p>}
        {doc.updatedAt && (
          <p className="mt-3 text-xs text-muted">
            Updated {new Date(doc.updatedAt).toLocaleDateString()}
            {doc.updatedByName ? ` by ${doc.updatedByName}` : ""}
          </p>
        )}
      </Card>
    </Link>
  );
}

export default async function DocCenterPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const actor = await requireAdminActor();
  if (actor === null) {
    return null;
  }

  const query = searchParams.q?.trim() ?? "";
  const category = (DOC_CATEGORIES as readonly string[]).includes(searchParams.category ?? "") ? searchParams.category! : "";
  const { docs, databaseAvailable } = await listDocs({ query, category });

  const grouped = DOC_CATEGORIES.map((name) => ({ name, docs: docs.filter((doc) => doc.category === name) })).filter(
    (group) => group.docs.length > 0,
  );
  const pinned = docs.filter((doc) => doc.pinned);
  const filtering = Boolean(query || category);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Doc Center">Procedures, references and guides for the staff team.</PageHeader>
        <Link href="/admin/docs/new" className={buttonClasses("primary", "shrink-0")}>
          <Plus className="h-4 w-4" /> New article
        </Link>
      </div>

      {!databaseAvailable && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          The database can&apos;t be reached, so only built-in articles are shown.
        </p>
      )}

      <form action="/admin/docs" className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search articles</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search titles and content"
            className="w-full rounded-md border border-line bg-ink py-2.5 pl-9 pr-3 text-sm text-bone placeholder:text-muted focus:border-trooper-500 focus:outline-none focus:ring-1 focus:ring-trooper-500"
          />
        </label>
        {category && <input type="hidden" name="category" value={category} />}
        <button type="submit" className={buttonClasses("secondary")}>
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={docHref({ q: query })}
          className={`rounded-full border px-3 py-1 transition-colors ${!category ? "border-trooper-500/60 bg-trooper-500/15 text-bone" : "border-line text-muted hover:text-bone"}`}
        >
          All
        </Link>
        {DOC_CATEGORIES.map((name) => (
          <Link
            key={name}
            href={docHref({ q: query, category: name })}
            className={`rounded-full border px-3 py-1 transition-colors ${category === name ? "border-trooper-500/60 bg-trooper-500/15 text-bone" : "border-line text-muted hover:text-bone"}`}
          >
            {name}
          </Link>
        ))}
      </div>

      {docs.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <BookOpen className="h-8 w-8 text-muted" />
          <p className="text-bone">No articles match{query ? ` "${query}"` : ""}.</p>
          <Link href="/admin/docs" className="text-sm text-trooper-300 hover:text-bone">
            Clear filters
          </Link>
        </Card>
      ) : filtering ? (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-[0.2em] text-muted">
            {docs.length} result{docs.length === 1 ? "" : "s"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {docs.map((doc) => (
              <DocCard key={doc.slug} doc={doc} />
            ))}
          </div>
        </section>
      ) : (
        <>
          {pinned.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-gold-400">Pinned</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pinned.map((doc) => (
                  <DocCard key={doc.slug} doc={doc} />
                ))}
              </div>
            </section>
          )}
          {grouped.map((group) => (
            <section key={group.name} className="space-y-3">
              <h2 className="text-sm uppercase tracking-[0.2em] text-muted">{group.name}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.docs.map((doc) => (
                  <DocCard key={doc.slug} doc={doc} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
