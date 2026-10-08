"use client";

import { autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { markOnboardingTourSeen, type TourPersistenceState } from "@/app/app/actions";
import { ONBOARDING_TOUR_VERSION, onboardingTourSteps, formTourForPath, formTours, tourRouteMatches, type FormTourId, type TourStep } from "@/lib/onboarding/tour";

type GuidedTourProps = { eligible: boolean; userId: string };
type TargetRect = { top: number; left: number; width: number; height: number };
type SessionState = { mainIndex: number; formIds: FormTourId[] };
const initialPersistenceState: TourPersistenceState = {};

function storageKey(userId: string) { return `status-board:onboarding-tour:${userId}:v${ONBOARDING_TOUR_VERSION}`; }
function readSession(userId: string): SessionState {
  try {
    const raw = window.sessionStorage.getItem(storageKey(userId));
    if (!raw) return { mainIndex: 0, formIds: [] };
    const value = JSON.parse(raw) as Partial<SessionState>;
    return { mainIndex: Number.isInteger(value.mainIndex) && value.mainIndex! >= 0 ? value.mainIndex! : 0, formIds: Array.isArray(value.formIds) ? value.formIds as FormTourId[] : [] };
  } catch { return { mainIndex: 0, formIds: [] }; }
}
function saveSession(userId: string, session: SessionState) { try { window.sessionStorage.setItem(storageKey(userId), JSON.stringify(session)); } catch { /* Storage may be blocked. */ } }
function clearSession(userId: string) { try { window.sessionStorage.removeItem(storageKey(userId)); } catch { /* Storage may be blocked. */ } }
function targetFor(step: TourStep) { return document.querySelector<HTMLElement>(step.target) ?? ("fallbackTarget" in step && step.fallbackTarget ? document.querySelector<HTMLElement>(step.fallbackTarget) : null); }

export function GuidedTour({ eligible, userId }: GuidedTourProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const replay = pathname === "/app" && searchParams.get("tour") === "1";
  const initialSession = useRef<SessionState | null>(null);
  if (initialSession.current === null) initialSession.current = typeof window === "undefined" ? { mainIndex: 0, formIds: [] } : readSession(userId);
  const [active, setActive] = useState(false);
  const [mainIndex, setMainIndex] = useState(replay ? 0 : initialSession.current.mainIndex);
  const [formIds, setFormIds] = useState<FormTourId[]>(replay ? [] : initialSession.current.formIds);
  const [flow, setFlow] = useState<"main" | FormTourId>("main");
  const [formIndex, setFormIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [persistState, persistAction, persisting] = useActionState(markOnboardingTourSeen, initialPersistenceState);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousPathname = useRef(pathname);
  const replayHandled = useRef(false);
  const { refs, floatingStyles, update } = useFloating({
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      offset(16),
      flip({ fallbackPlacements: ["top-start", "right-start", "left-start"], padding: 16 }),
      shift({ padding: 16 }),
      size({ padding: 16, apply({ availableHeight, availableWidth, elements }) { Object.assign(elements.floating.style, { maxHeight: `${Math.max(0, availableHeight)}px`, maxWidth: `${Math.min(360, availableWidth)}px` }); } }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const currentForm = formTourForPath(pathname);
  const mainStep = onboardingTourSteps[mainIndex];
  const selectedForm = flow === "main" ? undefined : formTours.find((tour) => tour.id === flow);
  const activeStep = flow === "main" ? mainStep : selectedForm?.steps[formIndex];
  const pathMatches = Boolean(activeStep && (flow === "main" ? tourRouteMatches(mainStep.route, pathname) : currentForm?.id === flow));

  useEffect(() => { if (eligible || replay) setActive(true); }, [eligible, replay]);
  useEffect(() => {
    if (!replay || replayHandled.current) return;
    replayHandled.current = true;
    clearSession(userId);
    setMainIndex(0);
    setFormIds([]);
    setFlow("main");
    setFormIndex(0);
  }, [replay, userId]);
  useEffect(() => {
    if (!active) return;
    if (currentForm && !formIds.includes(currentForm.id)) {
      setFormIds((current) => [...current, currentForm.id]);
      setFlow(currentForm.id);
      setFormIndex(0);
      return;
    }
    if (!currentForm && flow !== "main") setFlow("main");
  }, [active, currentForm, flow, formIds]);
  useEffect(() => {
    if (!active || flow !== "main" || !mainStep) return;
    if (pendingNavigation && previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setPendingNavigation(false);
      setMainIndex((current) => Math.min(current + 1, onboardingTourSteps.length - 1));
      return;
    }
    previousPathname.current = pathname;
    if (!tourRouteMatches(mainStep.route, pathname)) {
      const matchingStep = onboardingTourSteps.findIndex((candidate) => tourRouteMatches(candidate.route, pathname));
      if (matchingStep >= 0) setMainIndex(matchingStep);
    }
  }, [active, flow, mainStep, pendingNavigation, pathname]);
  useEffect(() => { if (active) saveSession(userId, { mainIndex, formIds }); }, [active, formIds, mainIndex, userId]);
  useEffect(() => {
    if (!active || !pathMatches || !activeStep) { setTargetRect(null); return; }
    let frame = 0;
    const updateTarget = () => {
      const target = targetFor(activeStep);
      if (!target) { setTargetRect(null); return; }
      const rect = target.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    const target = targetFor(activeStep);
    if (target) target.scrollIntoView({ block: "center", inline: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    refs.setReference(target);
    frame = window.requestAnimationFrame(updateTarget);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => { window.cancelAnimationFrame(frame); refs.setReference(null); window.removeEventListener("resize", updateTarget); window.removeEventListener("scroll", updateTarget, true); };
  }, [active, activeStep, pathMatches, refs]);
  useEffect(() => {
    if (!active || !pathMatches || !targetRect || !activeStep) return;
    dialogRef.current?.focus();
    const target = targetFor(activeStep);
    if (!target) return;
    target.setAttribute("aria-describedby", "guided-tour-description");
    return () => target.removeAttribute("aria-describedby");
  }, [active, activeStep, pathMatches, targetRect]);
  useEffect(() => {
    if (!active || !activeStep?.completion || activeStep.completion === "manual") return;
    const onClick = (event: MouseEvent) => { if (event.target instanceof Element && event.target.closest(activeStep.target)) setPendingNavigation(true); };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, activeStep]);
  useEffect(() => { if (targetRect) void update(); }, [targetRect, update]);
  useEffect(() => { if (!persisting && persistState.error) setActive(true); }, [persistState.error, persisting]);

  if (!active || !activeStep || !pathMatches || !targetRect) return null;
  const target = targetFor(activeStep);
  const isFallback = Boolean("fallbackTarget" in activeStep && activeStep.fallbackTarget && target && !document.querySelector(activeStep.target));
  const isMain = flow === "main";
  const isLast = isMain ? mainIndex === onboardingTourSteps.length - 1 : formIndex === (selectedForm?.steps.length ?? 1) - 1;
  const stepNumber = isMain ? mainIndex + 1 : formIndex + 1;
  const totalSteps = isMain ? onboardingTourSteps.length : selectedForm?.steps.length ?? 1;
  const persist = (intent: "skip" | "complete") => {
    clearSession(userId); setActive(false);
    const formData = new FormData(); formData.set("intent", intent);
    startTransition(() => persistAction(formData));
  };
  const next = () => {
    if (!isMain) {
      if (isLast) { setFlow("main"); return; }
      setFormIndex((current) => current + 1);
      return;
    }
    if (activeStep.completion === "submit") { target?.focus(); return; }
    if (activeStep.completion === "link") { setPendingNavigation(true); target?.click(); return; }
    if (isLast) { persist("complete"); return; }
    setMainIndex((current) => current + 1);
  };

  return <>
    <div aria-hidden="true" className="guided-tour-spotlight" style={{ height: targetRect.height + 12, left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12 }} />
    <div aria-describedby="guided-tour-description" aria-labelledby="guided-tour-title" aria-modal="false" className="guided-tour-popover" ref={(node) => { dialogRef.current = node; refs.setFloating(node); }} role="dialog" style={floatingStyles} tabIndex={-1}>
      <p className="guided-tour-progress">{isMain ? "Tutorial principal" : "Ajuda deste formulário"} · Passo {stepNumber} de {totalSteps}</p>
      <h2 id="guided-tour-title">{activeStep.title}</h2>
      <p id="guided-tour-description">{activeStep.description}</p>
      {isFallback ? <p className="guided-tour-note">Disponível após concluir a validação.</p> : null}
      {persistState.error ? <p className="form-error" role="alert">{persistState.error}</p> : null}
      <div className="guided-tour-actions">
        {((isMain && mainIndex > 0) || (!isMain && formIndex > 0)) ? <button className="muted-button" disabled={persisting || isPending} onClick={() => isMain ? setMainIndex((current) => current - 1) : setFormIndex((current) => current - 1)} type="button">Anterior</button> : null}
        <button className="text-link guided-tour-skip" disabled={persisting || isPending} onClick={() => isMain ? persist("skip") : setFlow("main")} type="button">{isMain ? "Pular tutorial" : "Fechar ajuda"}</button>
        {activeStep.completion !== "submit" ? <button className="primary-button" disabled={persisting || isPending} onClick={next} type="button">{activeStep.nextLabel ?? (isLast ? (isMain ? "Concluir tutorial" : "Fechar ajuda") : "Próximo")}</button> : null}
      </div>
    </div>
  </>;
}
