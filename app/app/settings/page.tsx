import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "../profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login" as Route);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, area")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/app" as Route);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href={"/app" as Route}>Status Board</Link>
        <p className="eyebrow">Configurações</p>
        <h1>Seu perfil.</h1>
        <p className="intro-copy">Nome e área aparecem na capa do status semanal.</p>
        <ProfileForm profile={profile} submitLabel="Salvar alterações" />
      </section>
    </main>
  );
}
