"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flag, Plus, Trash2, Trophy } from "lucide-react";
import {
  canApproveInMeeting,
  canManageArea,
  computeDaysUntil,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { CalendarCategory } from "@/lib/types";
import { AreaChip } from "./Badge";

const CATEGORY_META: Record<CalendarCategory, { label: string; dotClass: string; badgeClass: string }> = {
  competition: {
    label: "Competição SAE",
    dotClass: "bg-amber-500",
    badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-400",
  },
  meeting: {
    label: "Reunião",
    dotClass: "bg-blue-500",
    badgeClass: "border-blue-500/40 bg-blue-500/15 text-sky-400",
  },
  sprint: {
    label: "Sprint",
    dotClass: "bg-emerald-500",
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  },
  deadline: {
    label: "Marco / Entrega",
    dotClass: "bg-rose-500",
    badgeClass: "border-rose-500/40 bg-rose-500/15 text-rose-400",
  },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarView() {
  const { state, currentUser, setCompetitionDate, createCalendarEvent, deleteCalendarEvent } =
    useZeus();

  const [todayIso, setTodayIso] = useState<string>("2026-11-24");
  const [cursor, setCursor] = useState({ year: 2026, month: 10 });
  const [selectedDate, setSelectedDate] = useState("2026-11-24");
  const [seasonScope, setSeasonScope] = useState<"season" | "all">("all");

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-11-24");
  const [category, setCategory] = useState<CalendarCategory>("deadline");
  const [areaId, setAreaId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const now = new Date();
    const iso = now.toISOString().slice(0, 10);
    setTodayIso(iso);
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(iso);
    setDate(iso);
  }, []);

  const canManageComp = canApproveInMeeting(currentUser);
  const canCreate =
    canManageComp || ZEUS_AREAS.some((a) => canManageArea(currentUser, a.id));

  const daysUntilComp = computeDaysUntil(state.competitionDate, todayIso);

  const allItems = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      date: string;
      category: CalendarCategory;
      description?: string;
      areaId?: string;
      deletable: boolean;
    }> = [];

    for (const ev of state.calendarEvents) {
      if (seasonScope === "season" && ev.seasonYear !== state.activeSeason && ev.category !== "competition") {
        continue;
      }
      list.push({ ...ev, deletable: ev.category !== "competition" });
    }
    for (const mt of state.meetings) {
      if (seasonScope === "season" && mt.seasonYear !== state.activeSeason) continue;
      list.push({
        id: `mt-${mt.id}`,
        title: mt.title,
        date: mt.date,
        category: "meeting",
        areaId: mt.areaId,
        description: mt.type === "general" ? "Reunião Geral" : "Reunião de Área",
        deletable: false,
      });
    }
    for (const sp of state.sprints) {
      if (seasonScope === "season" && sp.seasonYear !== state.activeSeason) continue;
      list.push({
        id: `sp-end-${sp.id}`,
        title: `Fechamento: ${sp.name}`,
        date: sp.endDate,
        category: "sprint",
        description: `${sp.startDate} → ${sp.endDate}`,
        deletable: false,
      });
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [seasonScope, state.activeSeason, state.calendarEvents, state.meetings, state.sprints]);

  const monthStart = new Date(cursor.year, cursor.month, 1);
  const startWeekday = monthStart.getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = monthStart.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const cells: Array<{ day: number | null; iso: string | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, iso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(cursor.month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push({ day: d, iso: `${cursor.year}-${mm}-${dd}` });
  }

  const prevMonth = () =>
    setCursor((c) =>
      c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
    );
  const nextMonth = () =>
    setCursor((c) =>
      c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
    );

  const selectedDayItems = allItems.filter((i) => i.date === selectedDate);
  const upcomingItems = allItems.filter((i) => i.date >= todayIso).slice(0, 8);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    createCalendarEvent({
      title: title.trim(),
      date,
      category,
      description: description.trim() || undefined,
      areaId: areaId || undefined,
    });
    setTitle("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Competition Countdown Banner */}
      <div className="zeus-card rounded-xl p-4 border-amber-500/35 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--ink-subtle)]">
              Contagem Regressiva · SAE AeroDesign Brasil (São José dos Campos)
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-amber-500">
                {daysUntilComp > 0
                  ? `Faltam ${daysUntilComp} dias`
                  : daysUntilComp === 0
                  ? "É hoje!"
                  : `Passou há ${Math.abs(daysUntilComp)} dias`}
              </span>
              <span className="font-mono text-xs text-[var(--ink-subtle)]">
                ({state.competitionDate})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setSeasonScope("season")}
              className={`rounded px-2 py-1 ${
                seasonScope === "season" ? "bg-blue-600 text-white" : "text-[var(--ink-subtle)]"
              }`}
            >
              ZEUS {state.activeSeason}
            </button>
            <button
              type="button"
              onClick={() => setSeasonScope("all")}
              className={`rounded px-2 py-1 ${
                seasonScope === "all" ? "bg-blue-600 text-white" : "text-[var(--ink-subtle)]"
              }`}
            >
              Todos os anos
            </button>
          </div>
          {canManageComp && (
            <label className="flex items-center gap-1.5 text-xs text-[var(--ink-subtle)]">
              <span>Data alvo:</span>
              <input
                type="date"
                value={state.competitionDate}
                onChange={(e) => setCompetitionDate(e.target.value)}
                className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 text-xs text-[var(--ink)]"
              />
            </label>
          )}
          {canCreate && (
            <button
              onClick={() => {
                setDate(selectedDate);
                setShowForm((v) => !v);
              }}
              className="zeus-btn inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Novo Evento
            </button>
          )}
        </div>
      </div>

      {showForm && canCreate && (
        <form onSubmit={handleAddEvent} className="zeus-card rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold">Adicionar marco ao calendário</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              placeholder="Título do marco ou entrega..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CalendarCategory)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="deadline">Marco / Entrega</option>
              <option value="sprint">Sprint</option>
              <option value="meeting">Reunião</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="">Toda a equipe</option>
              {ZEUS_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  Área: {a.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Observação curta (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-[var(--hairline)] px-3 py-1 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold text-white"
            >
              Salvar Evento
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Grid */}
        <section className="lg:col-span-2 zeus-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold capitalize">{monthLabel}</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const now = new Date();
                  setCursor({ year: now.getFullYear(), month: now.getMonth() });
                  setSelectedDate(todayIso);
                }}
                className="rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px]"
              >
                Hoje
              </button>
              <button
                onClick={prevMonth}
                aria-label="Mês anterior"
                className="rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] p-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                aria-label="Próximo mês"
                className="rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] p-1"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--ink-subtle)] font-medium">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell.iso || cell.day === null) {
                return <div key={`empty-${idx}`} className="h-16 rounded-lg bg-transparent" />;
              }
              const dayEvents = allItems.filter((i) => i.date === cell.iso);
              const isSelected = selectedDate === cell.iso;
              const isToday = todayIso === cell.iso;
              return (
                <button
                  key={cell.iso}
                  onClick={() => setSelectedDate(cell.iso!)}
                  className={`h-16 rounded-lg border p-1.5 flex flex-col items-start justify-between text-left transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10"
                      : isToday
                      ? "border-amber-500/50 bg-amber-500/10"
                      : "border-[var(--hairline)] bg-[var(--surface-2)]/40 hover:border-[var(--hairline-strong)]"
                  }`}
                >
                  <span className="font-mono text-[11px] font-semibold">{cell.day}</span>
                  <div className="flex flex-wrap gap-1">
                    {dayEvents.slice(0, 4).map((ev) => (
                      <span
                        key={ev.id}
                        title={ev.title}
                        className={`h-1.5 w-1.5 rounded-full ${CATEGORY_META[ev.category].dotClass}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Agenda Side Panel */}
        <section className="zeus-card rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
              Dia selecionado · {selectedDate}
            </h3>
            {selectedDayItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--hairline)] p-3 text-xs text-[var(--ink-subtle)]">
                Nenhum evento nesta data.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayItems.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_META[ev.category].badgeClass}`}
                      >
                        <Flag className="h-2.5 w-2.5" />
                        {CATEGORY_META[ev.category].label}
                      </span>
                      {ev.deletable && canCreate && (
                        <button
                          onClick={() => deleteCalendarEvent(ev.id)}
                          className="text-[var(--ink-subtle)] hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs font-medium">{ev.title}</div>
                    {ev.description && (
                      <div className="text-[11px] text-[var(--ink-subtle)]">{ev.description}</div>
                    )}
                    {ev.areaId && <AreaChip areaId={ev.areaId} showName />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--hairline)] space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
              Próximos Marcos
            </h3>
            <div className="space-y-1.5">
              {upcomingItems.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedDate(ev.date)}
                  className="w-full text-left flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-[var(--surface-2)] transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${CATEGORY_META[ev.category].dotClass}`} />
                    <span className="truncate">{ev.title}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[var(--ink-subtle)] shrink-0">
                    {ev.date.slice(5)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
