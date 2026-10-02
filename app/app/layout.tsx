import type { Route } from "next";
import { redirect } from "next/navigation";
import { AccountToolbar } from "@/components/navigation/account-toolbar";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticatedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);

  return (
    <>
      <AccountToolbar />
      {children}
    </>
  );
}
