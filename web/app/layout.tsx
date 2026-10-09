import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Oswald } from "next/font/google";
import Link from "next/link";
import { getSession, DEV_AUTH_BYPASSED } from "@/lib/session";
import { STAFF_ADMIN_PERMISSION } from "@/lib/permissions";
import { AuthButton } from "@/components/AuthButton";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "NBT Roleplay",
  description: "NBT Roleplay - community, recruitment, and department information.",
};

const NAV_LINKS = [
  { href: "/rules", label: "Rules" },
  { href: "/guide", label: "Guide" },
  { href: "/join", label: "How to Join" },
  { href: "/departments", label: "Departments" },
] as const;

const FOOTER_SECTIONS = [
  {
    heading: "Community",
    links: [
      { href: "/rules", label: "Rules" },
      { href: "/guide", label: "Guide" },
      { href: "/join", label: "How to Join" },
      { href: "/departments", label: "Departments" },
      { href: "https://fire.nbt.gg", label: "SAFD Fire & Rescue" },
    ],
  },
  {
    heading: "Get Involved",
    links: [{ href: "/departments", label: "Apply Now" }],
  },
] as const;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        {DEV_AUTH_BYPASSED && (
          <div className="bg-amber-500/90 px-4 py-1.5 text-center text-xs font-medium text-black">
            Dev mode: signed in as a fake session (DEV_BYPASS_AUTH). Set DEV_BYPASS_AUTH=false to use real Discord sign-in.
          </div>
        )}
        <header className="sticky top-0 z-20 border-b border-line/80 bg-ink/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6 lg:flex-nowrap lg:gap-x-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3" aria-label="NBT Roleplay home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-10 w-auto drop-shadow-[0_0_12px_rgba(59,110,165,0.25)]" />
              <span className="hidden border-l border-line pl-3 text-[10px] font-semibold uppercase leading-tight tracking-[0.2em] text-bone sm:block">
                NBT
                <span className="block text-trooper-300">Roleplay</span>
              </span>
            </Link>
            <nav aria-label="Main navigation" className="site-nav-scroll order-3 -mx-4 flex w-[calc(100%+2rem)] flex-nowrap items-center justify-start gap-x-0 overflow-x-auto overscroll-x-contain border-t border-line px-2 pt-1 text-[11px] sm:mx-0 sm:w-full sm:gap-x-1 sm:px-0 sm:text-xs lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:overflow-visible lg:border-0 lg:pt-0">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link relative shrink-0 whitespace-nowrap px-1.5 py-2 font-semibold uppercase tracking-wider text-muted transition-colors hover:text-bone sm:px-3"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://fire.nbt.gg"
                target="_blank"
                rel="noreferrer"
                className="nav-link relative shrink-0 whitespace-nowrap px-1.5 py-2 font-semibold uppercase tracking-wider text-muted transition-colors hover:text-bone sm:px-3"
              >
                SAFD
              </a>
              {session?.permissions.includes(STAFF_ADMIN_PERMISSION) && (
                <Link
                  href="/admin"
                  className="shrink-0 rounded-sm border border-trooper-500/40 bg-trooper-700/20 px-3 py-1.5 font-semibold uppercase tracking-wider text-bone transition-colors hover:border-trooper-400"
                >
                  Staff Panel
                </Link>
              )}
            </nav>
            <div className="shrink-0">
              <AuthButton signedIn={Boolean(session)} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-line/80 bg-ink/80">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="NBT Roleplay" className="h-14 w-auto" />
              <p className="max-w-xs text-sm text-muted">
                An immersive FiveM roleplay community focused on law enforcement and emergency response across the
                State of San Andreas.
              </p>
            </div>
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.heading} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-steel">{section.heading}</h3>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("http") ? (
                        <a href={link.href} target="_blank" rel="noreferrer" className="text-muted transition-colors hover:text-bone">
                          {link.label} ↗
                        </a>
                      ) : (
                        <Link href={link.href} className="text-muted transition-colors hover:text-bone">
                        {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-line/60">
            <div className="mx-auto w-full max-w-7xl space-y-2 px-4 py-5 text-center text-xs text-muted sm:px-6 lg:px-8">
              <p>
                Website design and development © 2026{" "}
                <a
                  href="https://northbytetech.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-trooper-300 transition-colors hover:text-bone hover:underline"
                >
                  NorthByteTech
                </a>
                . All rights reserved.
              </p>
              <p>Images and logo © 2026 NBT Roleplay (NBTRP).</p>
              <p>
                NBT Roleplay is not affiliated with, endorsed by, or sponsored by Rockstar Games or
                Take-Two Interactive.
              </p>
            </div>
          </div>
        </footer>
        <SpeedInsights />
      </body>
    </html>
  );
}
