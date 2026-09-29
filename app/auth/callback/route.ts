import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  const response = NextResponse.redirect(new URL(next, origin));

  if (!code) {
    return response;
  }

  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.headers.get("cookie")?.split("; ").map((item) => {
        const [name, ...value] = item.split("=");
        return { name, value: value.join("=") };
      }) ?? [],
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
