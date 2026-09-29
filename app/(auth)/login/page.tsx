import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href="/">Status Board</Link>
        <p className="eyebrow">Acesso pessoal</p>
        <h1>Entre no seu status semanal.</h1>
        <p className="intro-copy">Registre sua semana e gere uma apresentação pronta para compartilhar.</p>
        <LoginForm />
      </section>
    </main>
  );
}
