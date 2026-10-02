import Link from "next/link";
import type { Route } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BrandLogo />
        <p className="eyebrow">Acesso pessoal</p>
        <h1>Entre no seu status semanal.</h1>
        <p className="intro-copy">Registre sua semana e gere uma apresentação pronta para compartilhar.</p>
        <LoginForm />
        <p className="auth-secondary-link"><Link href={"/signup" as Route}>Criar nova conta</Link></p>
      </section>
    </main>
  );
}
