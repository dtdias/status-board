"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { markOnboardingTourSeen, type TourPersistenceState } from "@/app/app/actions";
import { ONBOARDING_TOUR_VERSION, onboardingTourSteps, tourRouteMatches } from "@/lib/onboarding/tour";

type GuidedTourProps = { eligible: boolean; userId: string };
type TargetRect = { top: number; left: number; width: number; height: number };
const initialPersistenceState: TourPersistenceState = {};

function storageKey(userId: string) { return `status-board:onboarding-tour:${userId}:v${ONBOARDING_TOUR_VERSION}`; }
function readStep(userId: string) {
  try {
    const step = Number(window.sessionStorage.getItem(storageKey(userId)));
    return Number.isInteger(step) && step >= 0 && step < onboardingTourSteps.length ? step : 0;
  } catch { return 0; }
}
function saveStep(userId: string, step: number) { try { window.sessionStorage.setItem(storageKey(userId), String(step)); } catch { /* Storage may be blocked. */ } }
function clearStep(userId: string) { try { window.sessionStorage.removeItem(storageKey(userId)); } catch { /* Storage may be blocked. */ } }
function targetFor(step: (typeof onboardingTourSteps)[number]) { return document.querySelector<HTMLElement>(step.target) ?? (step.fallbackTarget ? document.querySelector<HTMLElement>(step.fallbackTarget) : null); }

export function GuidedTour({ eligible, userId }: GuidedTourProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const replay = pathname === "/app" && searchParams.get("tour") === "1";
  const [active, setActive] = useState(eligible || replay);
  const [stepIndex, setStepIndex] = useState(() => replay ? 0 : readStep(userId));
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [persistState, persistAction, persisting] = useActionState(markOnboardingTourSeen, initialPersistenceState);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousPathname = useRef(pathname);
  const step = onboardingTourSteps[stepIndex];
  const pathMatches = step ? tourRouteMatches(step.route, pathname) : false;

  useEffect(() => { if (eligible || replay) setActive(true); }, [eligible, replay]);
  useEffect(() => {
    if (!active || !step) return;
    if (pendingNavigation && previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      setPendingNavigation(false);
      setStepIndex((current) => Math.min(current + 1, onboardingTourSteps.length - 1));
      return;
    }
    previousPathname.current = pathname;
    if (!tourRouteMatches(step.route, pathname)) {
      const matchingStep = onboardingTourSteps.findIndex((candidate) => tourRouteMatches(candidate.route, pathname));
      if (matchingStep >= 0) setStepIndex(matchingStep);
    }
  }, [active, pathname, pendingNavigation, step]);
  useEffect(() => {
    if (!active || !pathMatches || !step) { setTargetRect(null); return; }
    let frame = 0;
    const update = () => {
      const target = targetFor(step);
      if (!target) { setTargetRect(null); return; }
      const rect = target.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    const target = targetFor(step);
    if (target) target.scrollIntoView({ block: "center", inline: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    frame = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [active, pathMatches, step]);
  useEffect(() => {
    if (!active || !pathMatches || !targetRect) return;
    dialogRef.current?.focus();
    const target = targetFor(step);
    if (!target) return;
    target.setAttribute("aria-describedby", "guided-tour-description");
    return () => target.removeAttribute("aria-describedby");
  }, [active, pathMatches, step, targetRect]);
  useEffect(() => {
    if (!active || !step?.advancesByNavigation) return;
    const onClick = (event: MouseEvent) => { if (event.target instanceof Element && event.target.closest(step.target)) setPendingNavigation(true); };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, step]);
  useEffect(() => { if (active) saveStep(userId, stepIndex); }, [active, stepIndex, userId]);
  useEffect(() => { if (!persisting && persistState.error) setActive(true); }, [persistState.error, persisting]);

  if (!active || !step || !pathMatches || !targetRect) return null;
  const target = targetFor(step);
  const isFallback = Boolean(step.fallbackTarget && target && !document.querySelector(step.target));
  const isLast = stepIndex === onboardingTourSteps.length - 1;
  const popupStyle = { top: Math.min(Math.max(targetRect.top + targetRect.height + 16, 16), window.innerHeight - 240), left: Math.min(Math.max(targetRect.left, 16), window.innerWidth - 376) };
  const persist = (intent: "skip" | "complete") => {
    clearStep(userId); setActive(false);
    const formData = new FormData(); formData.set("intent", intent);
    startTransition(() => persistAction(formData));
  };
  const next = () => {
    if (step.advancesByNavigation) { const liveTarget = targetFor(step); if (liveTarget) { setPendingNavigation(true); liveTarget.click(); } return; }
    if (isLast) { persist("complete"); return; }
    setStepIndex((current) => current + 1);
  };

  return <>
    <div aria-hidden="true" className="guided-tour-spotlight" style={{ height: targetRect.height + 12, left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12 }} />
    <div aria-describedby="guided-tour-description" aria-labelledby="guided-tour-title" aria-modal="false" className="guided-tour-popover" ref={dialogRef} role="dialog" style={popupStyle} tabIndex={-1}>
      <p className="guided-tour-progress">Passo {stepIndex + 1} de {onboardingTourSteps.length}</p>
      <h2 id="guided-tour-title">{step.title}</h2>
      <p id="guided-tour-description">{step.description}</p>
      {isFallback ? <p className="guided-tour-note">Disponível após concluir a validação.</p> : null}
      {persistState.error ? <p className="form-error" role="alert">{persistState.error}</p> : null}
      <div className="guided-tour-actions">
        {stepIndex > 0 ? <button className="muted-button" disabled={persisting || isPending} onClick={() => setStepIndex((current) => current - 1)} type="button">Anterior</button> : null}
        <button className="text-link guided-tour-skip" disabled={persisting || isPending} onClick={() => persist("skip")} type="button">Pular tutorial</button>
        <button className="primary-button" disabled={persisting || isPending} onClick={next} type="button">{step.nextLabel ?? (isLast ? "Concluir tutorial" : "Próximo")}</button>
      </div>
    </div>
  </>;
}
