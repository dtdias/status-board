"use client";

import { useEffect, useRef, useState } from "react";
import type { PptxViewer as PptxViewerInstance } from "@aiden0z/pptx-renderer";

export function PptxFilePreview({ src, method = "GET", caption }: { src: string; method?: "GET" | "POST"; caption?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PptxViewerInstance | null>(null);
  const [status, setStatus] = useState("Carregando arquivo PowerPoint…");
  const [error, setError] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let viewer: PptxViewerInstance | null = null;

    async function loadPresentation() {
      setError(null);
      setStatus("Carregando arquivo PowerPoint…");

      try {
        const response = await fetch(src, { cache: "no-store", credentials: "same-origin", method, signal: controller.signal });
        if (!response.ok) {
          const contentType = response.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const result = await response.json() as { message?: string; error?: string; errors?: Array<{ message: string }> };
            const details = result.errors?.map((issue) => issue.message).join(" ");
            throw new Error(details || result.message || result.error || "Não foi possível carregar a apresentação.");
          }
          throw new Error(response.status === 404 ? "Apresentação não encontrada." : "Não foi possível carregar a apresentação.");
        }
        const file = await response.arrayBuffer();
        const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import("@aiden0z/pptx-renderer");
        const container = containerRef.current;
        if (!container || disposed) return;

        viewer = await PptxViewer.open(file, container, {
          fitMode: "contain",
          lazyMedia: true,
          lazySlides: true,
          listOptions: { batchSize: 4, initialSlides: 3, showSlideLabels: true, windowed: true },
          onSlideChange: (index) => {
            if (!disposed) setActiveSlide(index);
          },
          signal: controller.signal,
          zipLimits: RECOMMENDED_ZIP_LIMITS,
        });
        if (disposed) {
          viewer.destroy();
          return;
        }
        viewerRef.current = viewer;
        setSlideCount(viewer.slideCount);
        setActiveSlide(viewer.currentSlideIndex);
        setStatus(`PPTX carregado. ${viewer.slideCount} slides.`);
      } catch (cause) {
        if (disposed || controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Não foi possível renderizar este arquivo PowerPoint.");
        setStatus("");
      }
    }

    void loadPresentation();
    return () => {
      disposed = true;
      controller.abort();
      viewer?.destroy();
      viewerRef.current = null;
    };
  }, [method, src]);

  function goToSlide(index: number) {
    void viewerRef.current?.goToSlide(index, { behavior: "smooth", block: "center" });
  }

  return (
    <section className="pptx-file-preview" aria-label="Pré-visualização do arquivo PowerPoint">
      <div className="pptx-preview-toolbar">
        <p aria-live="polite" role="status">{status}</p>
        <nav aria-label="Navegação dos slides">
          <button disabled={!slideCount || activeSlide <= 0} onClick={() => goToSlide(activeSlide - 1)} type="button">Slide anterior</button>
          <span>{slideCount ? `${activeSlide + 1} / ${slideCount}` : "—"}</span>
          <button disabled={!slideCount || activeSlide >= slideCount - 1} onClick={() => goToSlide(activeSlide + 1)} type="button">Próximo slide</button>
        </nav>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="pptx-render-viewport">
        <div className="pptx-render-container" ref={containerRef} />
      </div>
      <p className="form-hint">{caption ?? "Prévia feita do arquivo PPTX salvo. Renderização local no navegador; arquivo não é enviado a serviço externo."}</p>
    </section>
  );
}
