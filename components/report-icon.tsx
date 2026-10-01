import Image from "next/image";
import { getReportIcon, isReportIconKey, reportIconPath } from "@/lib/icons/report-icons";

export function ReportIcon({ iconKey, className = "" }: { iconKey: string; className?: string }) {
  const icon = getReportIcon(iconKey);
  const classes = ["report-icon", className].filter(Boolean).join(" ");

  return (
    <span aria-hidden="true" className={classes} data-icon-key={iconKey} title={icon?.label ?? "Ícone inválido"}>
      {isReportIconKey(iconKey) ? <Image alt="" height={48} src={reportIconPath(iconKey)} unoptimized width={48} /> : <span className="report-icon-invalid">!</span>}
    </span>
  );
}
