// Doc Center (/admin/docs) data layer: staff-written articles in the Doc
// table, merged with the read-only built-ins from lib/builtinDocs.ts. Like
// lib/adminData.ts, nothing here re-checks permissions - callers gate with
// requireAdminActor() first.
import { prisma } from "./prisma";
import type { AdminActor } from "./requireAdmin";
import { BUILTIN_DOCS, getBuiltinDoc } from "./builtinDocs";

export const DOC_CATEGORIES = [
  "Getting Started",
  "Staff Procedures",
  "Recruitment",
  "Rules & Policy",
  "Departments",
  "Development",
] as const;

export interface DocSummary {
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  pinned: boolean;
  builtin: boolean;
  updatedAt: string | null;
  updatedByName: string | null;
}

export interface DocDetail extends DocSummary {
  id: string | null;
  body: string;
  createdAt: string | null;
  createdByName: string | null;
}

export interface DocInput {
  title: string;
  category: string;
  summary: string | null;
  body: string;
  pinned: boolean;
}

export class DocValidationError extends Error {}

export function slugifyDocTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Shared by create and update so both API routes validate identically.
export function parseDocInput(body: unknown): DocInput {
  const raw = (body ?? {}) as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const category = typeof raw.category === "string" ? raw.category.trim() : "";
  const summary = typeof raw.summary === "string" && raw.summary.trim() ? raw.summary.trim() : null;
  const docBody = typeof raw.body === "string" ? raw.body : "";

  if (!title || title.length > 120) {
    throw new DocValidationError("Title is required (max 120 characters).");
  }
  if (!(DOC_CATEGORIES as readonly string[]).includes(category)) {
    throw new DocValidationError("Pick a category from the list.");
  }
  if (summary && summary.length > 300) {
    throw new DocValidationError("Summary is limited to 300 characters.");
  }
  if (!docBody.trim()) {
    throw new DocValidationError("The article body can't be empty.");
  }
  if (docBody.length > 100_000) {
    throw new DocValidationError("The article body is limited to 100,000 characters.");
  }
  return { title, category, summary, body: docBody, pinned: raw.pinned === true };
}

const builtinSummaries: DocSummary[] = BUILTIN_DOCS.map((doc) => ({
  slug: doc.slug,
  title: doc.title,
  category: doc.category,
  summary: doc.summary,
  pinned: false,
  builtin: true,
  updatedAt: null,
  updatedByName: null,
}));

function matches(doc: { title: string; summary: string | null; body?: string }, query: string): boolean {
  const needle = query.toLowerCase();
  return [doc.title, doc.summary ?? "", doc.body ?? ""].some((text) => text.toLowerCase().includes(needle));
}

export interface DocListResult {
  docs: DocSummary[];
  // False when the database couldn't be reached (e.g. DEV_BYPASS_AUTH with no
  // Postgres) - the list then holds built-ins only, so the page still works.
  databaseAvailable: boolean;
}

export async function listDocs(filters: { query?: string; category?: string } = {}): Promise<DocListResult> {
  const query = filters.query?.trim() ?? "";
  const category = filters.category?.trim() ?? "";

  let stored: DocSummary[] = [];
  let databaseAvailable = true;
  try {
    const rows = await prisma.doc.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { summary: { contains: query, mode: "insensitive" as const } },
                { body: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      select: { slug: true, title: true, category: true, summary: true, pinned: true, updatedAt: true, updatedByName: true },
    });
    stored = rows.map((row) => ({
      ...row,
      builtin: false,
      updatedAt: row.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("[fmrp-web] listDocs failed:", err);
    databaseAvailable = false;
  }

  const builtins = builtinSummaries.filter((doc) => {
    if (category && doc.category !== category) {
      return false;
    }
    return !query || matches({ ...doc, body: getBuiltinDoc(doc.slug)?.body }, query);
  });

  return { docs: [...stored, ...builtins], databaseAvailable };
}

export async function countDocs(): Promise<number> {
  const stored = await prisma.doc.count().catch(() => 0);
  return stored + BUILTIN_DOCS.length;
}

export async function getDoc(slug: string): Promise<DocDetail | null> {
  const builtin = getBuiltinDoc(slug);
  if (builtin) {
    return {
      ...builtin,
      id: null,
      pinned: false,
      builtin: true,
      createdAt: null,
      createdByName: null,
      updatedAt: null,
      updatedByName: null,
    };
  }

  const row = await prisma.doc.findUnique({ where: { slug } });
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary,
    body: row.body,
    pinned: row.pinned,
    builtin: false,
    createdAt: row.createdAt.toISOString(),
    createdByName: row.createdByName,
    updatedAt: row.updatedAt.toISOString(),
    updatedByName: row.updatedByName,
  };
}

// Finds a free slug for a new title: built-in slugs are reserved, and
// repeat titles get -2, -3, ... suffixes.
async function uniqueSlug(title: string): Promise<string> {
  const base = slugifyDocTitle(title) || "doc";
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    if (getBuiltinDoc(candidate)) {
      continue;
    }
    const taken = await prisma.doc.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) {
      return candidate;
    }
  }
  throw new DocValidationError("Couldn't find a free URL for that title - try a different one.");
}

async function logDocAction(actor: AdminActor, action: string, docId: string, details: string): Promise<void> {
  await prisma.auditLog.create({
    data: { actorId: actor.id, actorName: actor.name, action, targetType: "doc", targetId: docId, details },
  });
}

export async function createDoc(actor: AdminActor, input: DocInput): Promise<{ slug: string }> {
  const slug = await uniqueSlug(input.title);
  const doc = await prisma.doc.create({
    data: {
      ...input,
      slug,
      createdById: actor.id,
      createdByName: actor.name,
      updatedById: actor.id,
      updatedByName: actor.name,
    },
  });
  await logDocAction(actor, "doc_created", doc.id, doc.title);
  return { slug: doc.slug };
}

// The slug stays fixed on edit so existing links to an article keep working.
export async function updateDoc(actor: AdminActor, id: string, input: DocInput): Promise<{ slug: string }> {
  const doc = await prisma.doc.update({
    where: { id },
    data: { ...input, updatedById: actor.id, updatedByName: actor.name },
  });
  await logDocAction(actor, "doc_updated", doc.id, doc.title);
  return { slug: doc.slug };
}

export async function deleteDoc(actor: AdminActor, id: string): Promise<void> {
  const doc = await prisma.doc.delete({ where: { id } });
  await logDocAction(actor, "doc_deleted", doc.id, doc.title);
}
