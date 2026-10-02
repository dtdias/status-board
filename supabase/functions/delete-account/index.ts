import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const bucket = "generated-presentations";

async function listFiles(storage: ReturnType<ReturnType<typeof createClient>["storage"]["from"]>, prefix: string): Promise<string[]> {
  const { data, error } = await storage.list(prefix, { limit: 1000 });
  if (error) throw error;

  const files: string[] = [];
  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) files.push(path);
    else files.push(...await listFiles(storage, path));
  }
  return files;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) return new Response("Function not configured", { status: 500 });

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, publishableKey);
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json().catch(() => null) as { confirmation?: string } | null;
  if (body?.confirmation !== "EXCLUIR CONTA") return new Response("Confirmation required", { status: 400 });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const storage = admin.storage.from(bucket);
  const files = await listFiles(storage, user.id);

  for (let index = 0; index < files.length; index += 100) {
    const { error } = await storage.remove(files.slice(index, index + 100));
    if (error) return new Response("Could not remove account files", { status: 500 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return new Response("Could not remove account", { status: 500 });

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
