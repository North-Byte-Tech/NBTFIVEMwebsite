// Doc Center articles that ship with the code rather than living in the
// Doc table - reference material that should change alongside the code it
// describes (permissions, workflows, setup). They're read-only in the UI and
// their slugs are reserved, so a staff-written doc can never shadow one.
import { PERMISSION_CATALOG } from "./permissions";

export interface BuiltinDoc {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
}

const permissionTable = [
  "| Permission | Grants |",
  "| --- | --- |",
  ...PERMISSION_CATALOG.map((entry) => `| \`${entry.permission}\` | ${entry.label} |`),
].join("\n");

export const BUILTIN_DOCS: BuiltinDoc[] = [
  {
    slug: "admin-panel-overview",
    title: "Admin panel overview",
    category: "Getting Started",
    summary: "What each section of the staff panel is for and who can use it.",
    body: `Everything under **/admin** needs the \`fmrp.staff.admin\` permission. If you can read this, you have it.

## Sections

- **Overview**: pending work, the application pipeline and recent staff activity at a glance.
- **Accounts**: look up any website account by Discord name, Discord ID or account ID, then ban/unban, add player notes and manage permissions.
- **Staff**: the staff roster. Appointing someone marks them as staff; removing them also revokes every \`fmrp.staff.*\` permission they held.
- **Applications**: the recruitment review queue (see *Application review workflow*).
- **Departments**, **Application Types**, **Form Builder**: what each department recruits for and the questions applicants answer.
- **Department Decisions**: the final accept/reject board. Only the configured decision account can open it.
- **Doc Center**: this knowledge base. Any admin can write and edit articles.
- **Audit Log**: every admin action, newest first. Nothing in it can be edited or deleted.
- **Dev Dashboard**: runtime, configuration and database diagnostics. Needs \`fmrp.staff.developer\` as well.

> Every change you make in the panel is written to the audit log with your name on it.`,
  },
  {
    slug: "application-review-workflow",
    title: "Application review workflow",
    category: "Recruitment",
    summary: "How a recruitment application moves from submission to a final decision.",
    body: `Any signed-in Discord user can apply to a department from its public page. Each application moves through these statuses:

1. **Pending**: just submitted, waiting for a reviewer.
2. **Interview scheduled**: a reviewer picked an interview time. The applicant is notified by the Discord bot if it's configured.
3. **Interview completed**: the interview happened; add your notes.
4. **Awaiting final decision**: handed to the decision account.
5. **Accepted** / **Rejected**: the final decision, made on the Department Decisions board.

## Tips

- Record interview notes when you change the status. They're stored with the application and visible to the decision maker.
- Accepted applicants are sent the main community invite privately. The public site only links the recruitment Discord.
- Every status change is in the audit log under the reviewer's name.`,
  },
  {
    slug: "permissions-reference",
    title: "Permissions reference",
    category: "Staff Procedures",
    summary: "Every permission that can be granted from the Accounts page.",
    body: `Grant or revoke these from an account's page under **Accounts**. Changes take effect the next time that user loads a page.

${permissionTable}

## Notes

- \`fmrp.staff.admin\` is the key to this entire panel. Grant it sparingly.
- \`fmrp.staff.developer\` is website-only. It isn't offered by the Discord bot's \`/grant-permission\` command.
- Removing someone from the staff roster strips all of their \`fmrp.staff.*\` permissions automatically.`,
  },
  {
    slug: "developer-setup",
    title: "Developer setup",
    category: "Development",
    summary: "Running the website locally, database migrations and deploying.",
    body: `The site is a Next.js app in \`web/\` backed by its own Postgres database through Prisma.

## Run it locally

\`\`\`bash
pnpm install
pnpm --filter fmrp-web dev
\`\`\`

With \`DEV_BYPASS_AUTH\` unset, every page renders as a fake signed-in admin and developer, with no database or Discord app needed. Pages that read the database show an error or fall back where they can.

For the real flow, copy \`web/.env.example\` to \`web/.env.local\`, set \`DEV_BYPASS_AUTH=false\` and fill in \`DATABASE_URL\`, \`NEXTAUTH_SECRET\` and the Discord OAuth credentials.

## Database changes

1. Edit \`web/prisma/schema.prisma\`.
2. \`pnpm --filter fmrp-web exec prisma migrate dev --name <change>\` creates the migration.
3. Commit the new folder under \`web/prisma/migrations/\`.
4. After deploying, run \`prisma migrate deploy\` against production. The **Dev Dashboard** lists which migrations the live database has applied.

## Deploying

The site deploys to Vercel with **Root Directory** set to \`web\`. Set the same environment variables as \`.env.example\`. The Dev Dashboard flags any that are missing.`,
  },
];

export function getBuiltinDoc(slug: string): BuiltinDoc | undefined {
  return BUILTIN_DOCS.find((doc) => doc.slug === slug);
}
