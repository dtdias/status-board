import { NextResponse } from "next/server";
import { downloadGeneratedPresentation } from "@/lib/storage/generated-presentation";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ reportId: string; presentationId: string }> }) {
  const { reportId, presentationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await downloadGeneratedPresentation(supabase, reportId, presentationId);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = result.body.buffer.slice(result.body.byteOffset, result.body.byteOffset + result.body.byteLength) as ArrayBuffer;
    return new Response(body, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(result.presentation.fileName)}"; filename*=UTF-8''${encodeURIComponent(result.presentation.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download presentation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
