"use client";

import { useState } from "react";
import { ReportIcon } from "@/components/report-icon";
import { getReportIcon, isReportIconKey } from "@/lib/icons/report-icons";

export function ReportIconPicker({ label, name, defaultValue, options, dataTour }: { label: string; name: string; defaultValue: string; options: readonly string[]; dataTour?: string }) {
  const fallback = options[0] ?? "attention";
  const [selected, setSelected] = useState(isReportIconKey(defaultValue) ? defaultValue : fallback);
  const choices = options.includes(selected) ? options : [selected, ...options];

  return (
    <label className="report-icon-picker">
      {label}
      <span className="report-icon-picker-control" data-tour={dataTour}>
        <ReportIcon className="report-icon-picker-preview" iconKey={selected} />
        <select name={name} onChange={(event) => setSelected(event.currentTarget.value)} value={selected}>
          {choices.map((key) => <option key={key} value={key}>{getReportIcon(key)?.label ?? key}{options.includes(key) ? "" : " (atual)"}</option>)}
        </select>
      </span>
    </label>
  );
}
