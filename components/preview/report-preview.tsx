"use client";

import { useState } from "react";
import { demandPhaseLabels, demandPhases, phaseTone } from "@/lib/demands/demand";
import { deliveryStatusMeta } from "@/lib/deliveries/delivery";
import { incidentStatusMeta } from "@/lib/incidents/incident";
import type { PreviewInput, PreviewOverflow, PreviewSlide } from "@/lib/preview/compose-slides";

type Props = { input: PreviewInput; slides: PreviewSlide[]; overflow: PreviewOverflow[] };

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00`)) : "-";
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="preview-source" href={href} title="Abrir item no board">{children}</a>;
}

export function ReportPreview({ input, slides, overflow }: Props) {
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const page = active + 1;
  const route = `/app/reports/${input.report.id}`;

  return (
    <div className="preview-layout">
      <aside className="preview-rail" aria-label="Navegação dos slides">
        <p className="eyebrow">Slides</p>
        <ol>{slides.map((item, index) => <li key={`${item.kind}-${index}`}><button className={index === active ? "is-active" : ""} type="button" onClick={() => setActive(index)} aria-current={index === active ? "page" : undefined}><span>{index + 1}</span>{item.title}</button></li>)}</ol>
      </aside>
      <section className="preview-stage" aria-live="polite">
        {overflow.length ? <p className="preview-warning">{overflow.length} campo{overflow.length > 1 ? "s" : ""} excede{overflow.length === 1 ? "" : "m"} limite visual. Revise antes de gerar.</p> : null}
        <article className={`slide slide-${slide.kind}`} aria-label={`Slide ${page}: ${slide.title}`}>
          {slide.kind === "cover" ? <><p className="slide-area">{input.report.area}</p><h1>{slide.title}</h1><p className="slide-week">Semana de {date(input.report.startDate)} a {date(input.report.endDate)}</p><p className="slide-footer">{input.report.name} | {date(input.report.presentationDate)}</p></> : null}
          {slide.kind === "summary" ? <><SlideHeader title={slide.title} page={page} /><div className="slide-metrics"><Metric label="Entregas" value={slide.summary.deliveries} /><Metric label="Incidentes resolvidos" value={slide.summary.resolvedIncidents} /><Metric label="Demandas novas" value={slide.summary.newDemands} /><Metric label="Rotinas" value={slide.summary.supportRoutines} /></div><section className="slide-highlight"><p>Destaque da semana</p><strong>{input.report.highlight || "Sem destaque informado."}</strong></section></> : null}
          {slide.kind === "deliveries" ? <><SlideHeader title={slide.title} page={page} /><div className="slide-grid four">{slide.items.length ? slide.items.map((item) => <SourceLink href={`${route}/deliveries/${item.id}`} key={item.id}><span className="slide-icon">{item.iconKey[0]?.toUpperCase()}</span><strong>{item.title}</strong><p>{item.description}</p><b style={{ background: deliveryStatusMeta[item.status].color }}>{deliveryStatusMeta[item.status].label}</b></SourceLink>) : <Empty />}</div></> : null}
          {slide.kind === "incidents" ? <><SlideHeader title={slide.title} page={page} /><div className="slide-grid two">{slide.items.length ? slide.items.map((item) => <SourceLink href={`${route}/incidents/${item.id}`} key={item.id}><span className="slide-icon">{item.iconKey[0]?.toUpperCase()}</span><strong>{item.affectedSystem}</strong><p><b>O que aconteceu</b>{item.symptom}{item.cause ? ` ${item.cause}` : ""}</p><p><b>O que fizemos</b>{item.actionTaken}{item.supportPeople ? ` ${item.supportPeople}` : ""}</p><em style={{ color: incidentStatusMeta[item.status].color }}>{incidentStatusMeta[item.status].label}{item.resolvedAt ? ` | ${date(item.resolvedAt)}` : ""}</em></SourceLink>) : <Empty message="Sem incidentes na semana." />}</div></> : null}
          {slide.kind === "demand" ? <><SlideHeader title={slide.title} page={page} />{slide.item ? <SourceLink href={`${route}/demands/${slide.item.id}`}><span className="slide-icon">{slide.item.iconKey[0]?.toUpperCase()}</span><strong>{slide.item.title}</strong><p>Solicitante: {slide.item.requesterName} ({slide.item.requesterArea})<br />Áreas envolvidas: {slide.item.involvedAreas.join(", ")}</p><p>Objetivo: {slide.item.objective}</p><p>Status: {slide.item.statusText || "Não informado"}</p><div className="preview-timeline">{demandPhases.map((phase, index) => <span className={phaseTone(phase, slide.item!.currentPhase)} key={phase}>{index + 1}<small>{demandPhaseLabels[index]}</small></span>)}</div></SourceLink> : <Empty />}</> : null}
          {slide.kind === "support" ? <><SlideHeader title={slide.title} page={page} /><div className="slide-grid two">{slide.items.length ? slide.items.map((item) => <SourceLink href={`${route}/support-fronts/${item.id}`} key={item.id}><span className="slide-icon">{item.iconKey[0]?.toUpperCase()}</span><strong>{item.title}</strong><p>{item.activityType}</p><ul>{item.routines.map((routine) => <li key={routine.id}>{routine.title}</li>)}</ul></SourceLink>) : <Empty />}</div></> : null}
          {slide.kind === "attention" ? <><SlideHeader title={slide.title} page={page} /><div className="attention-slide"><AttentionList label="Dependências" empty="Nenhuma dependência." items={slide.dependencies} href={(id) => `${route}/attention/dependencies/${id}`} dateLabel="Desde" dateValue={(item) => item.waitingSince} /><AttentionList label="Próximos passos" empty="Nenhum próximo passo." items={slide.nextSteps} href={(id) => `${route}/attention/next-steps/${id}`} dateLabel="Prazo" dateValue={(item) => item.dueDate} /></div></> : null}
        </article>
        <nav className="preview-controls" aria-label="Controles do preview"><button type="button" onClick={() => setActive((current) => Math.max(0, current - 1))} disabled={active === 0}>Anterior</button><span>{page} / {slides.length}</span><button type="button" onClick={() => setActive((current) => Math.min(slides.length - 1, current + 1))} disabled={active === slides.length - 1}>Próximo</button></nav>
      </section>
    </div>
  );
}

function SlideHeader({ title, page }: { title: string; page: number }) { return <header className="slide-header"><h2>{title}</h2><span>{page}</span></header>; }
function Metric({ label, value }: { label: string; value: number }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Empty({ message = "Sem ocorrências na semana." }: { message?: string }) { return <p className="slide-empty">{message}</p>; }
function AttentionList<T extends { id: string; title: string; description: string | null; owner: string | null }>({ label, empty, items, href, dateLabel, dateValue }: { label: string; empty: string; items: T[]; href: (id: string) => string; dateLabel: string; dateValue: (item: T) => string | null }) { return <section><h3>{label}</h3>{items.length ? items.map((item) => <SourceLink href={href(item.id)} key={item.id}><strong>{item.title}</strong><p>{item.description}</p><small>{item.owner ? `Responsável: ${item.owner}` : ""}{dateValue(item) ? ` | ${dateLabel}: ${date(dateValue(item))}` : ""}</small></SourceLink>) : <Empty message={empty} />}</section>; }
