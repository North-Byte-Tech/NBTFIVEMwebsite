import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Flame, HeartPulse, Radio, Shield, ShieldCheck } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DepartmentRecruitmentGate, DepartmentRecruitmentPill, DepartmentRecruitmentStatus } from "@/components/DepartmentRecruitmentStatus";
import { DEPARTMENT_ACCENT_CLASSES, getDepartmentBySlug, getDepartmentImage, slugifyAgency, type DepartmentCode } from "@/lib/departments";

const DEPARTMENT_ICONS: Record<DepartmentCode, typeof Shield> = {
  LEO: Shield,
  SAFD: Flame,
  SAEMS: HeartPulse,
  DISPATCH: Radio,
  CIV: ShieldCheck,
};

export default function DepartmentPage({ params }: { params: { slug: string } }) {
  const department = getDepartmentBySlug(params.slug);
  if (!department) {
    notFound();
  }

  const accent = DEPARTMENT_ACCENT_CLASSES[department.accent];
  const Icon = DEPARTMENT_ICONS[department.code];

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="relative isolate flex min-h-64 items-end overflow-hidden rounded-2xl border border-line p-6 sm:min-h-80 sm:p-8">
          <Image
            src={getDepartmentImage(department.code).src}
            alt={getDepartmentImage(department.code).alt}
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
          <div className="relative z-10 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-trooper-300">NBT Roleplay / Departments</p>
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-bone shadow-glow-sm ${accent.iconBg}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl text-bone sm:text-5xl">{department.name}</h1>
              <DepartmentRecruitmentPill departmentCode={department.code} />
            </div>
            <p className="max-w-3xl text-steel-300">{department.summary}</p>
            {department.externalSiteUrl && (
              <a
                href={department.externalSiteUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses("secondary", "w-fit")}
              >
                Visit Fire & Rescue Website ↗
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <Card className="space-y-4 border border-line bg-surface/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Recruitment</p>
              <h2 className="mt-1 text-2xl text-bone">
                Applications <DepartmentRecruitmentStatus departmentCode={department.code} />
              </h2>
            </div>
            <DepartmentRecruitmentPill departmentCode={department.code} />
          </div>

          <p className="text-sm text-muted">
            {`Check current recruitment availability for ${department.name}. When applications are open, sign in and submit the department application form.`}
          </p>

          <DepartmentRecruitmentGate
            departmentCode={department.code}
            fallback={
              <div className="rounded-sm border border-line bg-ink/50 px-3 py-2 text-sm text-muted">
                Applications are temporarily closed.
              </div>
            }
          >
            <Link href={`/departments/${department.slug}/apply`} className={`${buttonClasses("primary")} w-full justify-center`}>
              Apply to {department.name}
            </Link>
          </DepartmentRecruitmentGate>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg text-bone">Quick Facts</h2>
          <ul className="space-y-2 text-sm text-muted">
            {department.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className={accent.text}>›</span>
                {feature}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {department.features.map((feature) => (
          <li key={feature} className={`rounded-xl border border-line bg-surface px-4 py-3 text-sm ${accent.text}`}>
            {feature}
          </li>
        ))}
      </ul>

      {(department.ranks.length > 0 || department.requirements.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {department.ranks.length > 0 && (
            <Card>
              <h2 className="text-lg text-bone">Rank Structure</h2>
              <ol className="mt-3 space-y-2 text-sm">
                {department.ranks.map((rank, index) => (
                  <li key={rank} className="flex items-center gap-3 text-muted">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-bone ${accent.iconBg}`}>
                      {index + 1}
                    </span>
                    {rank}
                  </li>
                ))}
              </ol>
            </Card>
          )}
          {department.requirements.length > 0 && (
            <Card>
              <h2 className="text-lg text-bone">Requirements to Join</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {department.requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-2">
                    <span className={accent.text}>›</span>
                    {requirement}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {department.agencyGroups && (
        <div className="grid gap-4 sm:grid-cols-2">
          {department.agencyGroups.map((group) => (
            <Card key={group.heading}>
              <h2 className="text-lg text-bone">{group.heading}</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {group.agencies.map((agency) => (
                  <li key={agency} className="flex items-start gap-2">
                    <span className={accent.text}>›</span>
                    <Link
                      href={`/departments/${department.slug}/agencies/${slugifyAgency(agency)}`}
                      className="hover:text-bone hover:underline"
                    >
                      {agency}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <DepartmentRecruitmentGate
        departmentCode={department.code}
        fallback={<p className="text-sm text-muted">Recruitment is currently closed. Check back later.</p>}
      >
        <Link href={`/departments/${department.slug}/apply`} className={buttonClasses("primary")}>
          Apply Now
        </Link>
      </DepartmentRecruitmentGate>
    </div>
  );
}
