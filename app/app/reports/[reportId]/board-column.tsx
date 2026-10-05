import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

type BoardColumnProps = {
  title: string;
  headingId: string;
  statusClassName: string;
  count: number;
  countLabel: string;
  emptyMessage: string;
  emptyMark?: boolean;
  addHref: Route;
  addLabel: string;
  className?: string;
  children?: ReactNode;
};

export function BoardColumn({
  title,
  headingId,
  statusClassName,
  count,
  countLabel,
  emptyMessage,
  emptyMark = false,
  addHref,
  addLabel,
  className = "",
  children,
}: BoardColumnProps) {
  const addAction = <Link className="column-add" href={addHref}>{addLabel}</Link>;

  return (
    <details className={`board-column${className ? ` ${className}` : ""}`} aria-labelledby={headingId} open>
      <summary className="column-heading">
        <span className={`status-dot ${statusClassName}`} aria-hidden="true" />
        <span className="column-title" id={headingId} role="heading" aria-level={3}>{title}</span>
        <span className="count" aria-label={countLabel}>{count}</span>
      </summary>
      {count > 0 ? <>
        {children}
        {addAction}
      </> : (
        <div className="empty-state">
          {emptyMark ? <span className="empty-mark" aria-hidden="true">+</span> : null}
          <p>{emptyMessage}</p>
          {addAction}
        </div>
      )}
    </details>
  );
}
