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
});
