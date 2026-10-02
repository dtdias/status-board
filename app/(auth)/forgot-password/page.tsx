import { BrandLogo } from "@/components/brand-logo";
import { EmailAuthForm } from "../login/email-auth-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <BrandLogo />
        <p className="eyebrow">Recuperação</p>
        <h1>Recupere seu acesso.</h1>
        <p className="intro-copy">Informe seu e-mail. Enviaremos um link para criar uma nova senha.</p>
        <EmailAuthForm kind="reset" />
      </section>
    </main>
  );
}
