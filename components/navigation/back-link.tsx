import Link from "next/link";
import type { Route } from "next";

export function BackLink({ href, label }: { href: Route; label: string }) {
  return (
    <Link className="outline-button back-link" href={href}>
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
