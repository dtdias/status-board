export type PptxGenerationStage = "load" | "template" | "generate" | "reserve" | "upload" | "finalize" | "status";

export type PptxGenerationFailure = {
  code: "report_unavailable" | "template_unavailable" | "generation_failed" | "storage_unavailable";
  message: string;
  status: number;
};

export function classifyPptxGenerationError(stage: PptxGenerationStage, error: unknown): PptxGenerationFailure {
  if (stage === "template") {
    return {
      code: "template_unavailable",
      message: "The presentation template is unavailable. Try again shortly or contact an administrator.",
      status: 503,
    };
  }

  if (stage === "load") {
    return {
      code: "report_unavailable",
      message: "The report could not be loaded. Refresh the page and try again.",
      status: 500,
    };
  }

  if (stage === "reserve" || stage === "upload" || stage === "finalize" || stage === "status") {
    return {
      code: "storage_unavailable",
      message: "The presentation could not be saved. Try again shortly.",
      status: 503,
    };
  }

  void error;
  return {
    code: "generation_failed",
    message: "The presentation could not be generated. Try again shortly.",
    status: 500,
  };
}
