import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Doc Center article renderer. react-markdown never renders raw HTML, so
// anything an admin types is safe to show to other staff as-is. There's no
// Tailwind typography plugin here, so each element is styled by hand to
// match the site.
const COMPONENTS: Components = {
  h1: ({ children }) => <h2 className="mt-8 text-3xl text-bone first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-8 border-b border-line pb-2 text-2xl text-bone first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 text-xl text-bone">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-5 font-semibold text-bone">{children}</h4>,
  p: ({ children }) => <p className="mt-4 leading-relaxed text-steel first:mt-0">{children}</p>,
  a: ({ href, children }) => {
    const external = Boolean(href && /^https?:\/\//.test(href));
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className="font-medium text-trooper-300 underline-offset-2 hover:text-bone hover:underline"
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="mt-4 list-disc space-y-1.5 pl-6 text-steel marker:text-trooper-400">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-1.5 pl-6 text-steel marker:text-trooper-400">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-bone">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 rounded-r-md border-l-2 border-gold-500 bg-gold-500/5 px-4 py-2 text-steel [&>p]:mt-2 [&>p:first-child]:mt-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-line" />,
  pre: ({ children }) => (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-ink p-4 text-sm leading-relaxed text-bone [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-bone">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[0.85em] text-trooper-300">{children}</code>
  ),
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-raised text-muted">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-line">{children}</tbody>,
  th: ({ children }) => <th className="px-3 py-2 font-medium">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-steel">{children}</td>,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ""} className="mt-4 max-w-full rounded-lg border border-line" />
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
