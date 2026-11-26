"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, Sparkles, X } from "lucide-react";
import type { NavTab } from "./AppShell";

export const ZEUS_TOUR_STORAGE_KEY = "zeus_onboarding_tour_v1_done";
const ZEUS_TOUR_EVENT = "zeus-onboarding-tour-change";

export function subscribeTourCompleted(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(ZEUS_TOUR_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ZEUS_TOUR_EVENT, callback);
  };
}

export function getTourCompletedSnapshot(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(ZEUS_TOUR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markTourCompleted(): void {
  try {
    localStorage.setItem(ZEUS_TOUR_STORAGE_KEY, "true");
  } catch {
    // ignore storage errors
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ZEUS_TOUR_EVENT));
  }
}

interface TourStep {
  id: string;
  tab?: NavTab;
  targetSelector?: string;
  mobileTargetSelector?: string;
  title: string;
  description: string;
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    tab: "dashboard",
    title: "Bem-vindo à Plataforma Zeus AeroDesign",
    description:
      "Este guia rápido mostra onde fica cada módulo da equipe para você acompanhar sprints, metas, calendário e entregas sem se perder.",
    tip: "Você pode reabrir este tutorial a qualquer momento pelo botão Tutorial no topo.",
  },
  {
    id: "nav",
    tab: "dashboard",
    targetSelector: '[data-tour="sidebar-nav"]',
    mobileTargetSelector: '[data-tour="mobile-nav"]',
    title: "Menu Principal & Divisões",
    description:
      "Aqui você navega entre Visão Geral, Sprints, Áreas Técnicas (as 8 áreas de engenharia), Grafo de Impactos, Calendário e a divisão Corporativa (Marketing, Gestão e Financeiro).",
    tip: "No computador você pode retrair o menu ou usar a caixa de filtro rápido no topo da barra.",
  },
  {
    id: "season",
    tab: "dashboard",
    targetSelector: '[data-tour="season-switcher"]',
    title: "Ciclo ZEUS 2026 & Novidades 2027",
    description:
      "Todo o cronograma e a equipe confirmada deste ano ficam concentrados em ZEUS 2026. O botão ZEUS 2027 já está reservado para a próxima temporada.",
    tip: "A lista de membros de 2027 ainda será atualizada após as entradas e saídas da equipe.",
  },
  {
    id: "sprints",
    tab: "sprints",
    targetSelector: '[data-tour="sprints-controls"]',
    title: "Sprints, Pop-ups & Filtros de Data",
    description:
      "Por padrão exibimos tudo. Você pode filtrar digitando qualquer data ou mês (ex.: 15/03/2026 ou março), filtrar pela sua área ou marcar 'Deixar só minha área como padrão'.",
    tip: "Os botões Nova Sprint e Nova Tarefa abrem pop-ups práticos para cadastrar entregas em sequência.",
  },
  {
    id: "areas",
    tab: "areas",
    targetSelector: '[data-tour="areas-grid"]',
    title: "Áreas Técnicas & Pedidos do Diretor",
    description:
      "Escolha uma das 8 áreas para ver o progresso do relatório, dependências e notas privadas. Dentro de cada área há também a aba exclusiva 'Pedidos do Diretor' para solicitar recursos da próxima atualização.",
    tip: "Cada cartão usa a cor oficial da área para identificação visual rápida.",
  },
  {
    id: "calendar",
    tab: "calendar",
    targetSelector: '[data-tour="calendar-banner"]',
    title: "Calendário & Dia da Competição",
    description:
      "Acompanhe a contagem regressiva até a SAE Brasil e navegue pelo mês digitando uma data em 'Ir para data' ou clicando direto no destaque da competição.",
    tip: "Os dias no calendário exibem as datas vinculadas aos marcos de Sprint, Reuniões e Competição.",
  },
  {
    id: "header",
    tab: "dashboard",
    targetSelector: '[data-tour="header-actions"]',
    title: "Busca Rápida, Presença & Ajuda",
    description:
      "Use Ctrl+K para pular direto para qualquer área, tarefa ou membro, marque 'Na sala' quando estiver no laboratório da UEMA e reabra este Tutorial sempre que precisar.",
    tip: "Bom voo! Se quiser rever os passos depois, clique em Tutorial aqui em cima.",
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTour({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const safeStepIndex = Math.min(stepIndex, TOUR_STEPS.length - 1);
  const step = TOUR_STEPS[safeStepIndex];

  const finishTour = useCallback(() => {
    markTourCompleted();
    setStepIndex(0);
    setTargetRect(null);
    onClose();
  }, [onClose]);

  const measureTarget = useCallback(() => {
    if (!open || typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    const selector =
      isMobile && step.mobileTargetSelector ? step.mobileTargetSelector : step.targetSelector;
    if (!selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setTargetRect(null);
      return;
    }
    const pad = 6;
    setTargetRect({
      top: Math.max(8, rect.top - pad),
      left: Math.max(8, rect.left - pad),
      width: Math.min(window.innerWidth - 16, rect.width + pad * 2),
      height: Math.min(window.innerHeight - 16, rect.height + pad * 2),
    });
  }, [open, step.mobileTargetSelector, step.targetSelector]);

  useEffect(() => {
    if (!open) return;
    if (step.tab) {
      onNavigate(step.tab);
    }
    const timerA = window.setTimeout(measureTarget, 90);
    const timerB = window.setTimeout(measureTarget, 320);
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.clearTimeout(timerA);
      window.clearTimeout(timerB);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [open, step.tab, onNavigate, measureTarget]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") finishTour();
      if (e.key === "ArrowRight") {
        if (safeStepIndex < TOUR_STEPS.length - 1) setStepIndex((i) => i + 1);
        else finishTour();
      }
      if (e.key === "ArrowLeft" && safeStepIndex > 0) {
        setStepIndex((i) => i - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, safeStepIndex, finishTour]);

  if (!open) return null;

  // Position tooltip card near spotlight without clipping off-screen
  let cardStyle: React.CSSProperties | undefined;
  if (targetRect && typeof window !== "undefined") {
    const cardWidth = Math.min(390, window.innerWidth - 32);
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
    const preferRight =
      targetRect.width < 320 && targetRect.left + targetRect.width + cardWidth + 24 < window.innerWidth;

    if (preferRight) {
      cardStyle = {
        position: "fixed",
        top: Math.min(window.innerHeight - 280, Math.max(16, targetRect.top)),
        left: targetRect.left + targetRect.width + 16,
        width: cardWidth,
      };
    } else if (spaceBelow >= 230) {
      cardStyle = {
        position: "fixed",
        top: targetRect.top + targetRect.height + 14,
        left: Math.min(window.innerWidth - cardWidth - 16, Math.max(16, targetRect.left)),
        width: cardWidth,
      };
    } else {
      cardStyle = {
        position: "fixed",
        top: Math.max(16, targetRect.top - 230),
        left: Math.min(window.innerWidth - cardWidth - 16, Math.max(16, targetRect.left)),
        width: cardWidth,
      };
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial interativo da plataforma Zeus"
    >
      {/* Dimmed backdrop when no target spotlight is active */}
      {!targetRect && (
        <div
          onClick={finishTour}
          className="fixed inset-0 bg-black/72 backdrop-blur-[2px]"
        />
      )}

      {/* Animated Spotlight Ring around highlighted area */}
      {targetRect && (
        <>
          <div onClick={finishTour} className="fixed inset-0" />
          <div
            className="fixed pointer-events-none rounded-xl border-2 border-sky-400 zeus-tour-spotlight"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
          />
        </>
      )}

      {/* Floating Guide Card */}
      <div
        style={cardStyle}
        className={`${
          targetRect ? "" : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(430px,calc(100vw-2rem))]"
        } zeus-card zeus-tour-card rounded-2xl border-[1.5px] border-sky-500/50 bg-[var(--surface-1)] p-5 shadow-2xl space-y-3.5`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-sky-300">
            <Compass className="h-3 w-3" />
            PASSO {safeStepIndex + 1} DE {TOUR_STEPS.length}
          </div>
          <button
            type="button"
            onClick={finishTour}
            aria-label="Pular tutorial"
            className="h-7 w-7 rounded-md border border-[var(--hairline)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-[var(--ink)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-[var(--ink)]">{step.title}</h3>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{step.description}</p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{step.tip}</span>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Ir para passo ${idx + 1}`}
                onClick={() => setStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === safeStepIndex
                    ? "w-5 bg-sky-400"
                    : "w-1.5 bg-[var(--hairline-strong)] hover:bg-sky-400/50"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {safeStepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--hairline)] px-2.5 py-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <ArrowLeft className="h-3 w-3" /> Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={finishTour}
                className="rounded-md px-2 py-1.5 text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              >
                Pular
              </button>
            )}

            {safeStepIndex < TOUR_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepIndex((i) => i + 1)}
                className="zeus-btn inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Próximo <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishTour}
                className="zeus-btn inline-flex items-center gap-1 rounded-md bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-zinc-950"
              >
                Concluir tutorial
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
