import { NextResponse } from "next/server";
import { listGeneratedPresentations } from "@/lib/storage/generated-presentation";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const presentations = await listGeneratedPresentations(supabase, reportId);
    return NextResponse.json({
      presentations: presentations.map((presentation) => ({
        ...presentation,
        downloadUrl: `/api/reports/${reportId}/presentations/${presentation.id}/download`,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load presentation history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
