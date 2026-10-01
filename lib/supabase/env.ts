import "server-only";

export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { url, publishableKey };
}
