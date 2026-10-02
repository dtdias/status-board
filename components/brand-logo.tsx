import Link from "next/link";
import type { Route } from "next";

type BrandLogoProps = {
  href?: Route | string;
  compact?: boolean;
};

export function BrandLogo({ href = "/", compact = false }: BrandLogoProps) {
  const logo = (
    <span className={`brand-logo${compact ? " brand-logo-compact" : ""}`}>
      <svg aria-hidden="true" className="brand-logo-mark" viewBox="0 0 48 48">
        <path d="M7 10.5 24 4l17 6.5v27L24 44 7 37.5v-27Z" fill="currentColor" />
        <path d="m15 17 9-3.5 9 3.5v14l-9 3.5-9-3.5V17Z" fill="var(--yellow)" />
        <path d="m24 13.5 9 3.5-9 3.5-9-3.5 9-3.5Zm0 7v14" fill="none" stroke="var(--ink)" strokeWidth="2" />
        <path d="M9 24h8M31 24h8" stroke="var(--yellow)" strokeWidth="2" />
      </svg>
      <span className="brand-logo-name">Status Board</span>
    </span>
  );

  return <Link href={href as Route}>{logo}</Link>;
}
