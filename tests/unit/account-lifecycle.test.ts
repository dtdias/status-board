import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("account lifecycle", () => {
  it("creates accounts through Supabase email confirmation", () => {
    const action = read("app/(auth)/signup/actions.ts");
    const page = read("app/(auth)/login/page.tsx");
    expect(action).toContain("supabase.auth.signUp");
    expect(action).toContain("emailRedirectTo");
    expect(action).toContain("toLowerCase()");
    expect(page).toContain('href={"/signup" as Route}');
  });

  it("requires reauthentication before invoking account deletion", () => {
    const action = read("app/app/actions.ts");
    const form = read("app/app/delete-account-form.tsx");
    expect(action).toContain("signInWithPassword");
    expect(action).toContain('supabase.functions.invoke("delete-account"');
    expect(form).toContain("EXCLUIR CONTA");
  });

  it("deletes private files before the auth user", () => {
    const functionSource = read("supabase/functions/delete-account/index.ts");
    expect(functionSource).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(functionSource).toContain("storage.remove");
    expect(functionSource).toContain("admin.auth.admin.deleteUser(user.id)");
  });

  it("forwards confirmation codes accidentally sent to the site root", () => {
    const home = read("app/page.tsx");
    expect(home).toContain("/auth/callback?");
    expect(home).toContain("params.code");
  });

  it("provides a five-minute resend cooldown and branded email templates", () => {
    const action = read("app/(auth)/signup/actions.ts");
    const migration = read("supabase/migrations/20261002181645_signup_confirmation_resend_cooldown.sql");
    const confirmation = read("docs/email-templates/supabase-confirmation.html");
    const invite = read("docs/email-templates/supabase-invite.html");
    expect(action).toContain('supabase.auth.resend({');
    expect(action).toContain('type: "signup"');
    expect(migration).toContain("cooldown_seconds constant integer := 300");
    expect(confirmation).toContain("{{ .ConfirmationURL }}");
    expect(invite).toContain("{{ .ConfirmationURL }}");
    expect(confirmation).toContain("#ffd400");
    expect(invite).toContain("STATUS BOARD");
  });

  it("keeps confirmed accounts out of signup resend and supports passwordless access safely", () => {
    const signup = read("app/(auth)/signup/actions.ts");
    const login = read("app/(auth)/login/actions.ts");
    const reset = read("app/(auth)/reset-password/actions.ts");
    const recovery = read("docs/email-templates/supabase-recovery.html");
    const magic = read("docs/email-templates/supabase-magic-link.html");
    expect(signup).toContain("identities.length === 0");
    expect(signup).toContain("accountConfirmed");
    expect(login).toContain("resetPasswordForEmail");
    expect(login).toContain("shouldCreateUser: false");
    expect(reset).toContain("supabase.auth.updateUser({ password");
    expect(recovery).toContain("{{ .ConfirmationURL }}");
    expect(magic).toContain("{{ .ConfirmationURL }}");
  });

  it("classifies duplicate and pending signup responses", () => {
    const signup = read("app/(auth)/signup/actions.ts");
    const form = read("app/(auth)/signup/signup-form.tsx");
    const resend = read("app/(auth)/signup/resend-confirmation-form.tsx");
    const config = read("supabase/config.toml");
    expect(signup).toContain('error.code === "user_already_exists"');
    expect(signup).toContain('error.code === "email_exists"');
    expect(signup).toContain("identities.length === 0");
    expect(signup).toContain("pendente de confirmação");
    expect(signup).toContain("Não foi possível reenviar a confirmação.");
    expect(form).toContain("initialCooldownUntil={state.cooldownUntil}");
    expect(resend).toContain("initialCooldownUntil");
    expect(config).toContain("enable_confirmations = true");
  });

  it("explains when recovery password matches the current password", () => {
    const reset = read("app/(auth)/reset-password/actions.ts");
    expect(reset).toContain('error?.code === "same_password"');
    expect(reset).toContain("Não foi possível definir esta senha. Escolha outra combinação e tente novamente.");
    expect(reset).not.toContain("senha atual");
  });
});
