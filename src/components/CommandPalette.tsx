"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Briefcase,
  CheckSquare,
  Compass,
  Search,
  User,
  X,
} from "lucide-react";
import { canAccessFinance, canApproveAccounts, ZEUS_AREAS } from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { NavTab } from "./AppShell";

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  subtitle?: string;
  colorHex?: string;
  kind: "tab" | "area" | "task" | "member" | "archive";
  onSelect: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onOpenProfile,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenProfile: (memberId: string) => void;
}) {
  const { state, currentUser } = useZeus();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];
    const navTabs: Array<{ id: NavTab; label: string; subtitle: string }> = [
      { id: "dashboard", label: "Visão Geral", subtitle: "Telemetria, previsão e mapa de cores" },
      { id: "sprints", label: "Sprints & Entregas", subtitle: "Tarefas, comentários e bloqueios" },
      { id: "areas", label: "Áreas Técnicas", subtitle: "Relatórios SAE das 8 áreas técnicas" },
      { id: "graph", label: "Grafo Obsidian", subtitle: "Conexões e dependências entre áreas" },
      { id: "revisoes", label: "Revisões (Design Freeze)", subtitle: "Snapshots técnicos Rev 1.0/2.0" },
      { id: "archive", label: "Acervo & Relatórios", subtitle: "Documentos históricos Teams/Drive" },
      { id: "flight", label: "Voo & Lições SAE", subtitle: "Checklist pré-voo e falhas passadas" },
      { id: "calendar", label: "Calendário SAE", subtitle: "Marcos e contagem regressiva" },
      { id: "ranking", label: "Equipe & Perfis", subtitle: "Membros, áreas, entregas e presença" },
      { id: "meetings", label: "Reuniões & Modo Quinzenal", subtitle: "Chamada, aprovações e ata" },
      { id: "marketing", label: "Corporativo · Marketing", subtitle: "Campanhas, mídia e patrocinadores" },
      { id: "gestao", label: "Corporativo · Gestão", subtitle: "OKRs e alocação da equipe" },
    ];

    if (canAccessFinance(currentUser)) {
      navTabs.push({
        id: "financeiro",
        label: "Corporativo · Financeiro",
        subtitle: "Caixa, lançamentos e orçamento por área",
      });
    }
    if (canApproveAccounts(currentUser)) {
      navTabs.push({
        id: "admin",
        label: "Gestão & Contas",
        subtitle: "Aprovar membros, papéis e bots Discord/Telegram",
      });
    }

    for (const t of navTabs) {
      list.push({
        id: `tab-${t.id}`,
        group: "Navegação",
        label: t.label,
        subtitle: t.subtitle,
        kind: "tab",
        onSelect: () => {
          onNavigate(t.id);
          onClose();
        },
      });
    }

    for (const area of ZEUS_AREAS) {
      const targetTab: NavTab =
        area.category === "corporate" ? (area.id as NavTab) : "areas";
      list.push({
        id: `area-${area.id}`,
        group: area.category === "corporate" ? "Áreas Corporativas" : "Áreas Técnicas",
        label: `${area.shortCode} · ${area.name}`,
        subtitle: area.description,
        colorHex: area.colorHex,
        kind: "area",
        onSelect: () => {
          onNavigate(targetTab);
          onClose();
        },
      });
    }

    for (const task of state.tasks.slice(0, 30)) {
      list.push({
        id: `task-${task.id}`,
        group: "Tarefas de Sprint",
        label: task.title,
        subtitle: `${task.areaId.toUpperCase()} · ${task.status.toUpperCase()}`,
        kind: "task",
        onSelect: () => {
          onNavigate("sprints");
          onClose();
        },
      });
    }

    for (const m of state.members.filter((mb) => mb.accountStatus === "approved")) {
      list.push({
        id: `member-${m.id}`,
        group: "Membros",
        label: m.fullName,
        subtitle: m.email,
        kind: "member",
        onSelect: () => {
          onOpenProfile(m.id);
          onClose();
        },
      });
    }

    for (const doc of state.archiveDocuments.slice(0, 20)) {
      list.push({
        id: `doc-${doc.id}`,
        group: "Acervo",
        label: doc.title,
        subtitle: `${doc.seasonYear} · ${doc.areaId}`,
        kind: "archive",
        onSelect: () => {
          onNavigate("archive");
          onClose();
        },
      });
    }

    return list;
  }, [
    currentUser,
    onClose,
    onNavigate,
    onOpenProfile,
    state.archiveDocuments,
    state.members,
    state.tasks,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 14);
    return items
      .filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          (i.subtitle ?? "").toLowerCase().includes(q) ||
          i.group.toLowerCase().includes(q)
      )
      .slice(0, 18);
  }, [items, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-16 p-4"
      onClick={onClose}
    >
      <div
        className="zeus-card zeus-tab-enter w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-[var(--hairline-strong)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[var(--hairline)] bg-[var(--surface-2)]/70">
          <Search className="h-4 w-4 text-sky-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ir para aba, área, tarefa, membro ou documento... (Esc fecha)"
            className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[var(--hairline)] p-1 text-[var(--ink-subtle)] hover:text-[var(--ink)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-[var(--hairline)]">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--ink-subtle)]">
              Nenhum resultado encontrado para &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon =
                item.kind === "task"
                  ? CheckSquare
                  : item.kind === "member"
                  ? User
                  : item.kind === "archive"
                  ? Archive
                  : item.kind === "area"
                  ? Briefcase
                  : Compass;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onSelect}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[var(--surface-2)]/80 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.colorHex ? (
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.colorHex }}
                      />
                    ) : (
                      <Icon className="h-3.5 w-3.5 text-[var(--ink-subtle)] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{item.label}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-[var(--ink-subtle)] truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--ink-subtle)] shrink-0">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
