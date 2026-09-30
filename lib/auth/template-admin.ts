import "server-only";

import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type TemplateAdminAccess =
  | { user: null; isAdmin: false }
  | { user: User; isAdmin: boolean };

// Authorization is based on the RLS-protected database allowlist, never JWT metadata.
export async function getTemplateAdminAccess(supabase: Supabase): Promise<TemplateAdminAccess> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const { data, error } = await supabase
    .from("template_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, isAdmin: !error && data !== null };
}
