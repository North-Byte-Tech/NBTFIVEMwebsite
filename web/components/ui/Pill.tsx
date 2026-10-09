import type { ReactNode } from "react";

// Small rounded tag used for hero eyebrows and section labels - the "Premium
// Roleplay" / "Next-Gen FiveM Roleplay" style badge, in NBT's own colors.
export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-trooper-600/40 bg-surface-raised/80 px-4 py-1.5 text-sm font-medium text-steel ${className}`}
    >
      {children}
    </span>
  );
}
