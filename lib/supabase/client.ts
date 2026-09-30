import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
