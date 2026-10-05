"use client";

import { Children, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type BoardTabDefinition = {
  id: string;
  label: string;
};

type BoardTabsProps = {
  tabs: readonly BoardTabDefinition[];
  children: ReactNode;
  disabled?: boolean;
};

const MOBILE_QUERY = "(max-width: 560px)";

export function BoardTabs({ tabs, children, disabled = false }: BoardTabsProps) {
  const panels = Children.toArray(children);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const [isMobile, setIsMobile] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const validTabIds = new Set(tabs.map((tab) => tab.id));
    const readHash = () => {
      const hash = window.location.hash.slice(1);
      if (validTabIds.has(hash)) setActiveTab(hash);
    };

    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [tabs]);

  function selectTab(id: string, focus = false) {
    setActiveTab(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);

    if (focus) {
      requestAnimationFrame(() => tabRefs.current[id]?.focus());
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    selectTab(tabs[nextIndex].id, true);
  }

  return (
    <div className="board-with-tabs">
      <div className="board-tabs" role="tablist" aria-label="Categorias do board" aria-orientation="horizontal">
        {tabs.map((tab, index) => (
          <button
            aria-controls={`report-board-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className="board-tab"
            id={`report-board-tab-${tab.id}`}
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            ref={(element) => { tabRefs.current[tab.id] = element; }}
            role="tab"
            tabIndex={activeTab === tab.id ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <section className="board report-board" aria-label="Board semanal" inert={disabled ? true : undefined}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <div
              aria-hidden={isMobile && !isActive ? true : undefined}
              aria-labelledby={`report-board-tab-${tab.id}`}
              className={`board-tab-panel${isActive ? " is-active" : ""}`}
              id={`report-board-panel-${tab.id}`}
              key={tab.id}
              role="tabpanel"
            >
              {panels[index]}
            </div>
          );
        })}
      </section>
    </div>
  );
}
