"use client";

import { useState } from "react";

export function PresentationActionLink({ href, label, loadingLabel, download, fileName }: { href: string; label: string; loadingLabel: string; download?: boolean; fileName?: string }) {
  const [loading, setLoading] = useState(false);
  return <a aria-busy={loading} className="outline-button" download={download ? fileName : undefined} href={href} onClick={() => setLoading(true)}>{loading ? loadingLabel : label}</a>;
}
