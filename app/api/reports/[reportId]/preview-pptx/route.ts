import { NextResponse } from "next/server";
import { generatePptx } from "@/lib/pptx/generate";
import { classifyPptxGenerationError, type PptxGenerationStage } from "@/lib/pptx/generation-error";
import { presentationFileName } from "@/lib/pptx/compose";
import { loadPresentationInput, presentationValidationInput } from "@/lib/reports/load-presentation-input";
import { getPresentationTemplateBuffer, PPTX_CONTENT_TYPE } from "@/lib/storage/presentation-template";
import { createClient } from "@/lib/supabase/server";
import { validateReport } from "@/lib/validation/report";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let stage: PptxGenerationStage = "load";
  try {
    const input = await loadPresentationInput(supabase, reportId, user.id);
    if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const validation = validateReport(presentationValidationInput(input));
    if (!validation.valid) return NextResponse.json(validation, { status: 422 });

    stage = "template";
    const template = await getPresentationTemplateBuffer(supabase);
    stage = "generate";
    const output = await generatePptx(input, template);
    const body = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${encodeURIComponent(presentationFileName(input))}"`,
        "Content-Type": PPTX_CONTENT_TYPE,
      },
    });
  } catch (error) {
    const failure = classifyPptxGenerationError(stage, error);
    return NextResponse.json(failure, { status: failure.status });
  }
}
