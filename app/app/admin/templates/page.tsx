import type { Route } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/navigation/back-link";
import { TemplateUploadForm } from "./template-upload-form";
import { getTemplateAdminAccess } from "@/lib/auth/template-admin";
import { createClient } from "@/lib/supabase/server";

export default async function TemplateAdminPage() {
  const supabase = await createClient();
  const access = await getTemplateAdminAccess(supabase);
  if (!access.user) redirect("/login" as Route);
  if (!access.isAdmin) redirect("/app" as Route);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BackLink href={"/app" as Route} label="Voltar às semanas" />
        <p className="eyebrow">Administração</p>
        <h1>Templates.</h1>
        <p className="intro-copy">Publique uma nova versão imutável para relatórios futuros.</p>
        <TemplateUploadForm />
      </section>
    </main>
  );
}
