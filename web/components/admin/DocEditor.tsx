"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Markdown } from "@/components/docs/Markdown";

const INPUT_CLASSES =
  "w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-bone placeholder:text-muted "
  + "focus:border-trooper-500 focus:outline-none focus:ring-1 focus:ring-trooper-500";

export interface DocEditorInitial {
  id: string;
  title: string;
  category: string;
  summary: string | null;
  body: string;
  pinned: boolean;
}

const STARTER_BODY = `## Overview

What this article covers and who it's for.

## Steps

1. First step
2. Second step

> Tip: keep articles short and link to related ones.
`;

export function DocEditor({ categories, initial }: { categories: readonly string[]; initial?: DocEditorInitial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [body, setBody] = useState(initial?.body ?? STARTER_BODY);
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(initial ? `/api/admin/docs/${initial.id}` : "/api/admin/docs", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, summary, body, pinned }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        setError(result?.message ?? "Couldn't save the article. Try again.");
        return;
      }
      router.push(`/admin/docs/${result.slug}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!initial || !window.confirm(`Delete "${initial.title}"? This can't be undone.`)) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/docs/${initial.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Couldn't delete the article. Try again.");
        return;
      }
      router.push("/admin/docs");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const tabClasses = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
      active ? "bg-trooper-500/20 text-bone" : "text-muted hover:text-bone"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required className={INPUT_CLASSES} />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={INPUT_CLASSES}>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-steel">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(event) => setPinned(event.target.checked)}
            className="h-4 w-4 accent-trooper-500"
          />
          Pin to the top of the Doc Center
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Summary (optional)</span>
          <input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={300}
            placeholder="One line shown in the article list"
            className={INPUT_CLASSES}
          />
        </label>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1">
            <button type="button" onClick={() => setTab("write")} className={tabClasses(tab === "write")}>
              Write
            </button>
            <button type="button" onClick={() => setTab("preview")} className={tabClasses(tab === "preview")}>
              Preview
            </button>
          </div>
          <p className="text-xs text-muted">Markdown: ## headings, **bold**, - lists, `code`, | tables |, &gt; callouts</p>
        </div>
        {tab === "write" ? (
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={22}
            className={`${INPUT_CLASSES} font-mono leading-relaxed`}
          />
        ) : (
          <div className="min-h-[20rem] rounded-md border border-line bg-ink/60 p-5">
            {body.trim() ? <Markdown>{body}</Markdown> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
          </div>
        )}
      </Card>

      {error && <p className="rounded-md border border-red-800/40 bg-red-900/20 px-4 py-2 text-sm text-red-300">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <button type="submit" disabled={pending} className={buttonClasses("primary")}>
            {pending ? "Saving..." : initial ? "Save changes" : "Publish article"}
          </button>
          <button type="button" onClick={() => router.back()} className={buttonClasses("ghost")}>
            Cancel
          </button>
        </div>
        {initial && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-sm font-medium text-red-300 transition-colors hover:text-red-200"
          >
            Delete article
          </button>
        )}
      </div>
    </form>
  );
}
