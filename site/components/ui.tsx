import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/* 12-col desktop grid shell: max ~1440, content ~1280, generous margins. */
export function Container({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return <div id={id} className={cn("mx-auto w-full max-w-[1440px] px-5 md:px-10 xl:px-[80px]", className)}>{children}</div>;
}

export function Section({
  children,
  dark = false,
  className,
  id,
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn(dark ? "dark-zone bg-coal text-bone" : "bg-paper text-ink", className)}>
      {children}
    </section>
  );
}

export function SectionLabel({ index, title, dark = false }: { index: string; title: string; dark?: boolean }) {
  return (
    <p className={cn("meta-label", dark ? "text-bone/60" : "text-muted")}>
      {index} / {title}
    </p>
  );
}

export function Display({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-display font-medium leading-[0.95] tracking-[-0.03em] text-[clamp(2.75rem,7vw,7rem)]",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("font-display font-medium leading-[1.0] tracking-[-0.025em] text-4xl md:text-6xl", className)}>
      {children}
    </h2>
  );
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  /** Render a plain anchor (new tab) for URLs outside the site, e.g. the local app. */
  external?: boolean;
  variant?: "primary" | "secondary" | "dark" | "accent";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function Button({ children, href, external = false, variant = "primary", className, onClick, type = "button" }: ButtonProps) {
  const styles = cn(
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border px-6 text-[15px] font-medium transition-colors duration-200",
    variant === "primary" && "border-ink bg-ink text-paper hover:bg-soot",
    variant === "secondary" && "border-line bg-transparent text-ink hover:border-ink",
    variant === "dark" && "border-bone/30 bg-transparent text-bone hover:border-bone",
    variant === "accent" && "border-accent bg-accent text-accent-ink hover:brightness-95",
    className
  );
  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={styles}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={styles}>
      {children}
    </button>
  );
}

export function TextLink({ children, href, className }: { children: ReactNode; href: string; className?: string }) {
  return (
    <Link href={href} className={cn("font-medium underline decoration-line underline-offset-4 hover:decoration-ink", className)}>
      {children}
    </Link>
  );
}

export function Divider({ dark = false, className }: { dark?: boolean; className?: string }) {
  return <hr className={cn("border-t", dark ? "border-bone/15" : "border-line", className)} />;
}

export function StatusBadge({
  children,
  tone = "neutral",
  dark = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "bad" | "accent";
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em]",
        tone === "neutral" && (dark ? "border-bone/25 text-bone/70" : "border-line text-muted"),
        tone === "good" && "border-accent bg-accent text-accent-ink",
        tone === "bad" && "border-ink bg-ink text-paper",
        tone === "accent" && "border-accent text-accent-ink"
      )}
    >
      {children}
    </span>
  );
}

export function Stat({ value, label, dark = false }: { value: string; label: string; dark?: boolean }) {
  return (
    <div>
      <p className="font-display text-4xl font-medium tracking-tight md:text-5xl">{value}</p>
      <p className={cn("meta-label mt-2", dark ? "text-bone/60" : "text-muted")}>{label}</p>
    </div>
  );
}

/* Editorial feature row: number + title + body, divided by hairlines. */
export function FeatureRow({
  index,
  title,
  body,
  dark = false,
  children,
}: {
  index: string;
  title: string;
  body: string;
  dark?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("grid grid-cols-4 gap-4 border-t py-8 md:grid-cols-12 md:py-10", dark ? "border-bone/15" : "border-line")}>
      <p className={cn("meta-label col-span-1", dark ? "text-bone/60" : "text-muted")}>{index}</p>
      <h3 className="col-span-3 font-display text-xl font-medium tracking-tight md:col-span-4 md:text-2xl">{title}</h3>
      <div className="col-span-4 md:col-span-7 md:col-start-6">
        <p className={cn("max-w-[52ch] text-base leading-relaxed md:text-lg", dark ? "text-bone/75" : "text-muted")}>{body}</p>
        {children}
      </div>
    </div>
  );
}
