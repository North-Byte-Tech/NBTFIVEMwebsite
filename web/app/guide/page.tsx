import Link from "next/link";
import { BookOpen, Compass, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconTile, type IconTileTone } from "@/components/ui/IconTile";
import { buttonClasses } from "@/components/ui/Button";

const RECRUITMENT_DISCORD_URL = (process.env.NEXT_PUBLIC_RECRUITMENT_DISCORD_URL ?? "https://discord.gg/DPYATmwcqV").trim();

const GUIDE_STEPS = [
  {
    title: "Explore the departments",
    body: "Compare department roles and read each page for its focus, recruitment status, and current published information.",
    href: "/departments",
    cta: "Browse departments",
    icon: Compass,
    tone: "trooper",
  },
  {
    title: "Review the rules",
    body: "Start with the website summary, then read the current full rules in the community Discord before playing.",
    href: "/rules",
    cta: "Read the rules",
    icon: BookOpen,
    tone: "steel",
  },
  {
    title: "Sign in with Discord",
    body: "Discord sign-in creates your website account. You need it to submit a department application; a FiveM account link is not required for the website.",
    href: "/departments",
    cta: "Start an application",
    icon: UserRound,
    tone: "gold",
  },
  {
    title: "Join the recruitment Discord",
    body: "Use the recruitment Discord to connect with the community and find out about recruitment and next steps.",
    href: RECRUITMENT_DISCORD_URL,
    cta: "Join Discord",
    icon: MessageCircle,
    tone: "trooper",
  },
] satisfies {
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: typeof BookOpen;
  tone: IconTileTone;
}[];

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Community Guide">
        A straightforward starting point for exploring Florida Metro RP, reviewing the rules, and applying to a department.
      </PageHeader>

      <ol className="grid gap-4 sm:grid-cols-2">
        {GUIDE_STEPS.map((step, index) => (
          <li key={step.title}>
            <Card className="flex h-full items-start gap-4">
              <IconTile tone={step.tone}>
                <step.icon className="h-6 w-6" />
              </IconTile>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-trooper-300">Step {index + 1}</p>
                <h2 className="mt-1 text-lg text-bone">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
                <Link
                  href={step.href}
                  target={step.href.startsWith("http") ? "_blank" : undefined}
                  rel={step.href.startsWith("http") ? "noreferrer" : undefined}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-trooper-300 hover:text-bone"
                >
                  {step.cta} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="flex flex-col gap-4 border-trooper-500/40 bg-trooper-950/30 sm:flex-row sm:items-center">
        <IconTile tone="gold">
          <ShieldCheck className="h-6 w-6" />
        </IconTile>
        <div className="flex-1">
          <h2 className="text-lg text-bone">Have a question?</h2>
          <p className="mt-1 text-sm text-muted">Join the recruitment Discord to connect with the community.</p>
        </div>
        <Link
          href={RECRUITMENT_DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses("primary", "w-full rounded-full focus-visible:ring-2 focus-visible:ring-trooper-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:w-auto")}
        >
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
          Join Discord
        </Link>
      </Card>
    </div>
  );
}
