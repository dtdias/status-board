"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "status-board-install-prompt-dismissed";

function isStandalone() {
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || standaloneNavigator.standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, "true");
  } catch {
    // Session storage can be unavailable in privacy-restricted browsers.
  }
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) {
      setDismissed(true);
      return;
    }

    setIos(isIosDevice());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleAppInstalled = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (dismissed || (!installPrompt && !ios)) return null;

  function dismiss() {
    rememberDismissal();
    setDismissed(true);
    setInstallPrompt(null);
  }

  async function install() {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
    }
  }

  return (
    <aside className="pwa-install-banner" aria-label="Instalar Status Board">
      <div>
        <strong>Instale o Status Board</strong>
        {installPrompt ? (
          <p>Acesso rápido e experiência online-first.</p>
        ) : (
          <p>No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</p>
        )}
      </div>
      <div className="pwa-install-actions">
        {installPrompt ? <button className="primary-button" onClick={install} type="button">Instalar app</button> : null}
        <button className="muted-button" onClick={dismiss} type="button">Agora não</button>
      </div>
    </aside>
  );
}
