import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function AppPage() {
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
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyebrow">Configuração inicial</p>
          <h1>Antes, conte quem apresenta.</h1>
          <p className="intro-copy">Seu nome e área aparecem na capa do status semanal.</p>
          <ProfileForm />
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <p className="eyebrow">{profile.area}</p>
      <h1>Olá, {profile.name}.</h1>
      <p className="intro-copy">Seu board semanal será construído nesta área.</p>
    </main>
  );
}
