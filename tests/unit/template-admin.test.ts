import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getTemplateAdminAccess } from "@/lib/auth/template-admin";

function supabaseFor(userId: string | null, allowlisted: boolean) {
  return {
    auth: { getUser: async () => ({ data: { user: userId ? { id: userId, app_metadata: { role: "admin" } } : null } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: allowlisted ? { user_id: userId } : null, error: null }) }),
      }),
    }),
  };
}

describe("template admin authorization", () => {
  it("rejects an unauthenticated request", async () => {
    await expect(getTemplateAdminAccess(supabaseFor(null, false) as never)).resolves.toEqual({ user: null, isAdmin: false });
  });

  it("uses the database allowlist rather than client-controlled user metadata", async () => {
    await expect(getTemplateAdminAccess(supabaseFor("user-id", false) as never)).resolves.toMatchObject({ isAdmin: false });
    await expect(getTemplateAdminAccess(supabaseFor("user-id", true) as never)).resolves.toMatchObject({ isAdmin: true });
  });
});
