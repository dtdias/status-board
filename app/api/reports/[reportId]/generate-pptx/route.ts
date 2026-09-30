import { NextResponse } from "next/server";
import { generatePptx } from "@/lib/pptx/generate";
import { classifyPptxGenerationError, type PptxGenerationStage } from "@/lib/pptx/generation-error";
import { presentationFileName } from "@/lib/pptx/compose";
import { loadPresentationInput, presentationValidationInput } from "@/lib/reports/load-presentation-input";
import { discardGeneratedPresentation, reserveGeneratedPresentation, uploadGeneratedPresentation } from "@/lib/storage/generated-presentation";
import { getPresentationTemplateBuffer } from "@/lib/storage/presentation-template";
import { createClient } from "@/lib/supabase/server";
import { validateReport } from "@/lib/validation/report";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let stage: PptxGenerationStage = "load";
  try {
    console.info("pptx_generation_started", { requestId, reportId, userId: user.id });
    const input = await loadPresentationInput(supabase, reportId, user.id);
    if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const validation = validateReport(presentationValidationInput(input));
    if (!validation.valid) {
      console.info("pptx_generation_rejected", { requestId, reportId, userId: user.id, errorCount: validation.errors.length, warningCount: validation.warnings.length });
      return NextResponse.json(validation, { status: 422 });
    }

    stage = "template";
    const templateBuffer = await getPresentationTemplateBuffer(supabase);
    stage = "generate";
    const output = await generatePptx(input, templateBuffer);
    stage = "reserve";
    const presentation = await reserveGeneratedPresentation(supabase, reportId, presentationFileName(input));
    try {
      stage = "upload";
      await uploadGeneratedPresentation(supabase, presentation.storage_path, output);
    } catch (error) {
      try {
        await discardGeneratedPresentation(supabase, presentation.id, presentation.storage_path);
      } catch {
        console.error("pptx_generation_cleanup_failed", { requestId, reportId, userId: user.id, presentationId: presentation.id });
      }
      throw error;
    }

    console.info("pptx_generation_succeeded", { requestId, reportId, userId: user.id, presentationId: presentation.id, version: presentation.version, durationMs: Date.now() - startedAt });
    return NextResponse.json({
      presentation: {
        id: presentation.id,
        version: presentation.version,
        fileName: presentation.file_name,
        generatedAt: presentation.generated_at,
        downloadUrl: `/api/reports/${reportId}/presentations/${presentation.id}/download`,
      },
    });
  } catch (error) {
    const failure = classifyPptxGenerationError(stage, error);
    console.error("pptx_generation_failed", { requestId, reportId, userId: user.id, stage, code: failure.code, status: failure.status, errorName: error instanceof Error ? error.name : "UnknownError", durationMs: Date.now() - startedAt });
    return NextResponse.json(failure, { status: failure.status });
  }
}
