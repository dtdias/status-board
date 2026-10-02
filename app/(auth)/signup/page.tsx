import { BrandLogo } from "@/components/brand-logo";
import { SignUpForm } from "./signup-form";

export default function SignUpPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BrandLogo />
        <p className="eyebrow">Novo acesso</p>
        <h1>Crie sua conta semanal.</h1>
        <p className="intro-copy">Confirme seu e-mail para começar a organizar o trabalho e gerar apresentações.</p>
        <SignUpForm />
      </section>
    </main>
  );
}
