import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { PptxFilePreview } from "@/components/preview/pptx-file-preview";
import { BackLink } from "@/components/navigation/back-link";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/server";

export default async function GeneratedPresentationPreviewPage({ params }: { params: Promise<{ reportId: string; presentationId: string }> }) {
  const { reportId, presentationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);

  const { data: report } = await supabase.from("weekly_reports").select("id").eq("id", reportId).eq("user_id", user.id).maybeSingle();
  if (!report) notFound();

  const { data: presentation } = await supabase
    .from("generated_presentations")
    .select("id, version, file_name")
    .eq("weekly_report_id", reportId)
    .eq("id", presentationId)
    .maybeSingle();
  if (!presentation) notFound();

  const downloadUrl = `/api/reports/${reportId}/presentations/${presentationId}/download`;
  return (
    <main className="shell pptx-preview-page">
      <header className="topbar">
        <div>
          <BrandLogo href={`/app/reports/${reportId}`} />
          <p className="eyebrow">Prévia do arquivo gerado</p>
          <h1>PowerPoint — versão {presentation.version}</h1>
          <p className="pptx-preview-filename">{presentation.file_name}</p>
        </div>
        <div className="actions">
          <BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" />
          <a className="primary-button" download={presentation.file_name} href={downloadUrl}>Baixar PPTX</a>
        </div>
      </header>
      <PptxFilePreview src={downloadUrl} />
    </main>
  );
}
