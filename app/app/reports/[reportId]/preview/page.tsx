import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { PptxFilePreview } from "@/components/preview/pptx-file-preview";
import { BackLink } from "@/components/navigation/back-link";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/server";

export default async function PreviewPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);

  const { data: report } = await supabase.from("weekly_reports").select("id").eq("id", reportId).eq("user_id", user.id).maybeSingle();
  if (!report) notFound();

  return (
    <main className="shell preview-shell">
      <header className="topbar">
        <div>
          <BrandLogo href={`/app/reports/${reportId}`} />
          <p className="eyebrow">Preview PPTX atual</p>
          <h1>Pré-visualização</h1>
        </div>
        <BackLink href={`/app/reports/${reportId}` as Route} label="Voltar ao board" />
      </header>
      <PptxFilePreview
        caption="Gerado em memória com o template e o mesmo gerador do arquivo final. Preview renderizado localmente no navegador; nenhum PPTX é salvo ou enviado a serviço externo."
        method="POST"
        src={`/api/reports/${reportId}/preview-pptx`}
      />
    </main>
  );
}
