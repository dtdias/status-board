import type { Route } from "next";
import { redirect } from "next/navigation";
import { AccountToolbar } from "@/components/navigation/account-toolbar";
import { GuidedTour } from "@/components/onboarding/guided-tour";
import { createClient } from "@/lib/supabase/server";
import { ONBOARDING_TOUR_VERSION } from "@/lib/onboarding/tour";

export default async function AuthenticatedAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);
  const { data: profile } = await supabase.from("profiles").select("onboarding_tour_seen_version").eq("id", user.id).maybeSingle();

  return (
    <div className="app-layout">
      <AccountToolbar />
      {children}
      <GuidedTour eligible={(profile?.onboarding_tour_seen_version ?? ONBOARDING_TOUR_VERSION) < ONBOARDING_TOUR_VERSION} userId={user.id} />
    </div>
  );
}
