import { NextResponse } from "next/server";
import { generatePptx } from "@/lib/pptx/generate";
import { presentationFileName } from "@/lib/pptx/compose";
import { loadPresentationInput, presentationValidationInput } from "@/lib/reports/load-presentation-input";
import { getPresentationTemplateBuffer } from "@/lib/storage/presentation-template";
import { createClient } from "@/lib/supabase/server";
import { validateReport } from "@/lib/validation/report";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = await loadPresentationInput(supabase, reportId, user.id);
    if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const validation = validateReport(presentationValidationInput(input));
    if (!validation.valid) return NextResponse.json(validation, { status: 422 });

    const templateBuffer = await getPresentationTemplateBuffer(supabase);
    const output = await generatePptx(input, templateBuffer);
    const body = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
    return new Response(body, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${presentationFileName(input)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate presentation.";
    const status = message === "Presentation template is unavailable." ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
