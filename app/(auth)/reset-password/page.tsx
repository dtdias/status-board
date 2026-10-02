import { redirect } from "next/navigation";
import type { Route } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password" as Route);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BrandLogo />
        <p className="eyebrow">Nova senha</p>
        <h1>Volte ao seu status.</h1>
        <p className="intro-copy">Escolha uma senha nova para continuar.</p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
