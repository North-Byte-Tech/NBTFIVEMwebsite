import type { ReactNode } from "react";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-heading">
      <p className="page-heading__eyebrow">Florida Metro RP</p>
      <h1 className="text-4xl text-bone sm:text-5xl">{title}</h1>
      {children && <p className="max-w-2xl text-muted">{children}</p>}
    </header>
  );
}
