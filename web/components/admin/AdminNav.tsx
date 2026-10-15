"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  ClipboardList,
  FileStack,
  Gavel,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  ShieldCheck,
  SquareTerminal,
  Users,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

// Sidebar on large screens, a horizontally scrolling strip below that. Items
// the viewer can't open (decision board, dev dashboard) are left out by the
// layout rather than shown and then refused.
export function AdminNav({ canDecide, isDeveloper }: { canDecide: boolean; isDeveloper: boolean }) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      heading: "General",
      items: [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/docs", label: "Doc Center", icon: BookOpen },
      ],
    },
    {
      heading: "People",
      items: [
        { href: "/admin/accounts", label: "Accounts", icon: Users },
        { href: "/admin/staff", label: "Staff", icon: ShieldCheck },
      ],
    },
    {
      heading: "Recruitment",
      items: [
        { href: "/admin/applications", label: "Applications", icon: ClipboardList },
        ...(canDecide ? [{ href: "/admin/department-decisions", label: "Department Decisions", icon: Gavel }] : []),
        { href: "/admin/departments", label: "Departments", icon: Building2 },
        { href: "/admin/application-types", label: "Application Types", icon: FileStack },
        { href: "/admin/form-builder", label: "Form Builder", icon: ListChecks },
      ],
    },
    {
      heading: "System",
      items: [
        { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
        ...(isDeveloper ? [{ href: "/admin/dev", label: "Dev Dashboard", icon: SquareTerminal }] : []),
      ],
    },
  ];

  return (
    <nav aria-label="Admin navigation" className="site-nav-scroll -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <div className="flex gap-1 lg:flex-col lg:gap-6">
        {groups.map((group) => (
          <div key={group.heading} className="flex gap-1 lg:flex-col">
            <p className="hidden px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted lg:block">
              {group.heading}
            </p>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-trooper-500/15 text-bone ring-1 ring-inset ring-trooper-500/40"
                      : "text-muted hover:bg-surface-raised hover:text-bone"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-trooper-300" : ""}`} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
