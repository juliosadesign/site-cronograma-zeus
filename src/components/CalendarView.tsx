"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Flag, Plus, Trash2, Trophy } from "lucide-react";
import {
  buildTintedCardStyle,
  canApproveInMeeting,
  canManageArea,
  computeDaysUntil,
  getAreaCardStyle,
  getAreaMeta,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { CalendarCategory } from "@/lib/types";
import { AreaChip } from "./Badge";

const CATEGORY_META: Record<
  CalendarCategory,
  { label: string; hex: string; dotClass: string; badgeClass: string }
> = {
  competition: {
    label: "Competição SAE",
    hex: "#f59e0b",
    dotClass: "bg-amber-400",
    badgeClass: "border-amber-400/60 bg-amber-500/20 text-amber-600 dark:text-amber-300",
  },
  meeting: {
    label: "Reunião",
    hex: "#3b82f6",
    dotClass: "bg-blue-500",
    badgeClass: "border-blue-500/45 bg-blue-500/15 text-blue-600 dark:text-sky-300",
  },
  sprint: {
    label: "Sprint",
    hex: "#10b981",
    dotClass: "bg-emerald-500",
    badgeClass: "border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  deadline: {
    label: "Marco / Entrega",
    hex: "#f43f5e",
    dotClass: "bg-rose-500",
    badgeClass: "border-rose-500/45 bg-rose-500/15 text-rose-600 dark:text-rose-300",
  },
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function parseIsoParts(iso: string): { year: number; monthIndex: number; day: number } {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return {
    year: y || 2026,
    monthIndex: Math.max(0, Math.min(11, (m || 1) - 1)),
    day: d || 1,
  };
}

function formatPtBrDate(iso: string): string {
  const { year, monthIndex, day } = parseIsoParts(iso);
  return new Date(year, monthIndex, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLocalIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
    const iso = formatLocalIso(now);
    setTodayIso(iso);
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(iso);
    setDate(iso);
  }, []);

  const canManageComp = canApproveInMeeting(currentUser);
  const canCreate =
    canManageComp || ZEUS_AREAS.some((a) => canManageArea(currentUser, a.id));

  const daysUntilComp = computeDaysUntil(state.competitionDate, todayIso);

  const jumpToDate = (iso: string) => {
    const { year, monthIndex } = parseIsoParts(iso);
    setSelectedDate(iso.slice(0, 10));
    setCursor({ year, month: monthIndex });
  };

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

    let hasCompEventAtTarget = false;
    for (const ev of state.calendarEvents) {
      if (ev.category === "competition") {
        if (ev.date !== state.competitionDate) continue;
        hasCompEventAtTarget = true;
      } else if (seasonScope === "season" && ev.seasonYear !== state.activeSeason) {
        continue;
      }
      list.push({ ...ev, deletable: ev.category !== "competition" });
    }

    if (state.competitionDate && !hasCompEventAtTarget) {
      list.push({
        id: "comp-sae-target",
        title: "Competição SAE AeroDesign Brasil — SJC",
        date: state.competitionDate,
        category: "competition",
        description: "Dia D — Etapa Nacional em São José dos Campos (SP).",
        deletable: false,
      });
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
        id: `sp-start-${sp.id}`,
        title: `Início: ${sp.name}`,
        date: sp.startDate,
        category: "sprint",
        description: `${sp.startDate} → ${sp.endDate}`,
        deletable: false,
      });
      list.push({
        id: `sp-end-${sp.id}`,
        title: `Fechamento: ${sp.name}`,
        date: sp.endDate,
        category: "sprint",
        description: `${sp.startDate} → ${sp.endDate}`,
        deletable: false,
      });
    }

    for (const mkt of state.marketingCampaigns) {
      if (!mkt.dueDate) continue;
      if (seasonScope === "season" && mkt.seasonYear !== state.activeSeason) continue;
      list.push({
        id: `mkt-${mkt.id}`,
        title: mkt.title,
        date: mkt.dueDate,
        category: "deadline",
        areaId: "marketing",
        description: `Marketing · ${mkt.partnerOrChannel}`,
        deletable: false,
      });
    }

    for (const rev of state.aircraftRevisions) {
      if (rev.status === "draft") continue;
      if (seasonScope === "season" && rev.seasonYear !== state.activeSeason) continue;
      list.push({
        id: `rev-${rev.id}`,
        title: `Design Freeze: ${rev.versionTag}`,
        date: rev.createdAt,
        category: "deadline",
        areaId: "integracao",
        description: rev.title,
        deletable: false,
      });
    }

    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [
    seasonScope,
    state.activeSeason,
    state.aircraftRevisions,
    state.calendarEvents,
    state.competitionDate,
    state.marketingCampaigns,
    state.meetings,
    state.sprints,
  ]);

  const scopedSprints = useMemo(
    () =>
      state.sprints.filter(
        (sp) => seasonScope === "all" || sp.seasonYear === state.activeSeason
      ),
    [seasonScope, state.activeSeason, state.sprints]
  );

  const monthStart = new Date(cursor.year, cursor.month, 1);
  const startWeekday = monthStart.getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = monthStart.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const monthEventsCount = allItems.filter((i) => i.date.startsWith(monthPrefix)).length;

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
    jumpToDate(date);
    setTitle("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Competition Countdown Banner */}
      <div
        className="zeus-card rounded-xl p-4 border-[1.5px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={buildTintedCardStyle("#f59e0b", { active: true, emphasis: "medium" })}
      >
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-amber-400 text-zinc-950 shadow-[0_0_20px_-4px_rgba(245,158,11,0.8)] flex items-center justify-center shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--ink-muted)]">
              Contagem Regressiva · SAE AeroDesign Brasil (São José dos Campos)
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-amber-500 dark:text-amber-400">
                {daysUntilComp > 0
                  ? `Faltam ${daysUntilComp} dias`
                  : daysUntilComp === 0
                  ? "É hoje!"
                  : `Passou há ${Math.abs(daysUntilComp)} dias`}
              </span>
              <span className="font-mono text-xs text-[var(--ink-muted)]">
                ({formatPtBrDate(state.competitionDate)})
              </span>
              <button
                type="button"
                onClick={() => jumpToDate(state.competitionDate)}
                className="inline-flex items-center gap-1 rounded-md border border-amber-400/70 bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-200 hover:bg-amber-400/30 transition-colors"
              >
                <CalendarDays className="h-3 w-3" /> Ver no calendário
              </button>
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
            <label className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
              <span>Data alvo:</span>
              <input
                type="date"
                value={state.competitionDate}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setCompetitionDate(e.target.value);
                  jumpToDate(e.target.value);
                }}
                className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 text-xs text-[var(--ink)]"
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
        {/* Monthly Visual Grid */}
        <section className="lg:col-span-2 zeus-card rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold capitalize">{monthLabel}</h2>
              <span className="rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink-subtle)]">
                {monthEventsCount} {monthEventsCount === 1 ? "marco no mês" : "marcos no mês"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => jumpToDate(state.competitionDate)}
                className="zeus-btn inline-flex items-center gap-1 rounded-md border border-amber-400/70 bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-400/30"
              >
                <Trophy className="h-3 w-3" /> Dia da Competição
              </button>
              <button
                type="button"
                onClick={() => jumpToDate(todayIso)}
                className="rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] hover:border-[var(--hairline-strong)]"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Mês anterior"
                className="rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] p-1 hover:border-[var(--hairline-strong)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Próximo mês"
                className="rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] p-1 hover:border-[var(--hairline-strong)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Visual Legend */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/50 px-3 py-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-300">
              <Trophy className="h-3 w-3 text-amber-400" />
              Competição SAE (Dia D)
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--ink-muted)]">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Reunião
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--ink-muted)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Sprint
            </span>
            <span className="inline-flex items-center gap-1.5 text-[var(--ink-muted)]">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Marco / Entrega
            </span>
            <span className="text-[10px] text-[var(--ink-subtle)]">
              · Eventos com área usam a cor da área no bloco
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-[var(--ink-subtle)] font-medium">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell, idx) => {
              if (!cell.iso || cell.day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[84px] sm:min-h-[104px] rounded-xl bg-transparent"
                  />
                );
              }
              const dayEvents = allItems.filter((i) => i.date === cell.iso);
              const coveringSprint = scopedSprints.find(
                (sp) => cell.iso! >= sp.startDate && cell.iso! <= sp.endDate
              );
              const isSelected = selectedDate === cell.iso;
              const isToday = todayIso === cell.iso;
              const isCompetitionDay =
                cell.iso === state.competitionDate ||
                dayEvents.some((ev) => ev.category === "competition");

              const firstAreaEv = dayEvents.find((ev) => Boolean(ev.areaId));
              const primaryHex = isCompetitionDay
                ? "#f59e0b"
                : firstAreaEv?.areaId
                ? getAreaMeta(firstAreaEv.areaId).colorHex
                : dayEvents[0]
                ? CATEGORY_META[dayEvents[0].category].hex
                : null;

              const cellStyle = isCompetitionDay
                ? {
                    background:
                      "linear-gradient(135deg, rgba(245, 158, 11, 0.44) 0%, rgba(251, 191, 36, 0.25) 55%, rgba(234, 88, 12, 0.30) 100%)",
                    boxShadow:
                      "0 0 0 1px rgba(251, 191, 36, 0.85), 0 0 24px -4px rgba(245, 158, 11, 0.72), inset 0 1px 0 rgba(254, 243, 199, 0.45)",
                  }
                : primaryHex
                ? buildTintedCardStyle(primaryHex, { active: isSelected, emphasis: "medium" })
                : undefined;

              const nonCompEvents = dayEvents.filter((ev) => ev.category !== "competition");
              const maxPills = isCompetitionDay ? 1 : 2;
              const visiblePills = nonCompEvents.slice(0, maxPills);
              const overflowCount = nonCompEvents.length - visiblePills.length;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => setSelectedDate(cell.iso!)}
                  style={cellStyle}
                  className={`min-h-[84px] sm:min-h-[104px] rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between gap-1 text-left transition-all relative overflow-hidden ${
                    isCompetitionDay
                      ? "zeus-comp-day border-2 border-amber-400"
                      : primaryHex
                      ? "zeus-area-card"
                      : isToday
                      ? "border-blue-500/70 bg-blue-500/10"
                      : "border-[var(--hairline)] bg-[var(--surface-2)]/40 hover:border-[var(--hairline-strong)]"
                  } ${
                    isSelected
                      ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-[var(--surface-1)]"
                      : ""
                  }`}
                >
                  <div className="w-full space-y-1">
                    {coveringSprint && !isCompetitionDay && (
                      <div
                        title={coveringSprint.name}
                        className="h-1 w-full rounded-full bg-emerald-400/60"
                      />
                    )}

                    <div className="flex items-center justify-between gap-1">
                      {isCompetitionDay ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-zinc-950">
                          {cell.day}
                        </span>
                      ) : isToday ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 font-mono text-[11px] font-bold text-white">
                            {cell.day}
                          </span>
                          <span className="hidden sm:inline font-mono text-[8px] font-bold uppercase text-blue-500 dark:text-sky-300">
                            Hoje
                          </span>
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] font-semibold text-[var(--ink)]">
                          {cell.day}
                        </span>
                      )}

                      {isCompetitionDay ? (
                        <span className="inline-flex items-center gap-0.5 rounded border border-amber-300/75 bg-amber-400/25 px-1 py-0.2 font-mono text-[8px] font-bold text-amber-800 dark:text-amber-200">
                          <Trophy className="h-2.5 w-2.5 text-amber-500 dark:text-amber-300" />
                          <span className="hidden sm:inline">DIA D</span>
                        </span>
                      ) : dayEvents.length > 1 ? (
                        <span className="rounded-full bg-black/15 dark:bg-black/35 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[var(--ink)]">
                          {dayEvents.length}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Linked events visually rendered inside the day square */}
                  <div className="w-full space-y-1 min-w-0">
                    {isCompetitionDay && (
                      <div
                        title="Competição SAE AeroDesign Brasil — SJC"
                        className="w-full rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950 flex items-center gap-1 shadow-xs"
                      >
                        <Trophy className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">SAE Brasil</span>
                      </div>
                    )}

                    {visiblePills.map((ev) => {
                      const evHex = ev.areaId
                        ? getAreaMeta(ev.areaId).colorHex
                        : CATEGORY_META[ev.category].hex;
                      const areaCode = ev.areaId ? getAreaMeta(ev.areaId).shortCode : null;
                      return (
                        <div
                          key={ev.id}
                          title={ev.title}
                          style={{
                            borderColor: `${evHex}99`,
                            backgroundColor: `${evHex}26`,
                          }}
                          className="w-full rounded border px-1 py-0.5 flex items-center gap-1 min-w-0"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: evHex }}
                          />
                          <span className="truncate text-[9px] sm:text-[10px] font-medium leading-tight text-[var(--ink)]">
                            {areaCode ? `[${areaCode}] ` : ""}
                            {ev.title}
                          </span>
                        </div>
                      );
                    })}

                    {overflowCount > 0 && (
                      <div className="px-1 font-mono text-[9px] font-semibold text-[var(--ink-muted)]">
                        +{overflowCount} mais
                      </div>
                    )}
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
              Dia selecionado · {formatPtBrDate(selectedDate)}
            </h3>
            {selectedDayItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--hairline)] p-3 text-xs text-[var(--ink-subtle)]">
                Nenhum evento vinculado nesta data.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayItems.map((ev) => {
                  const isComp = ev.category === "competition";
                  const cardStyle = isComp
                    ? buildTintedCardStyle("#f59e0b", { active: true, emphasis: "strong" })
                    : ev.areaId
                    ? getAreaCardStyle(ev.areaId, { emphasis: "medium" })
                    : buildTintedCardStyle(CATEGORY_META[ev.category].hex, { emphasis: "medium" });

                  return (
                    <div
                      key={ev.id}
                      style={cardStyle}
                      className="rounded-xl border p-3 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${CATEGORY_META[ev.category].badgeClass}`}
                        >
                          {isComp ? (
                            <Trophy className="h-2.5 w-2.5" />
                          ) : (
                            <Flag className="h-2.5 w-2.5" />
                          )}
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
                      <div className="text-xs font-semibold text-[var(--ink)]">{ev.title}</div>
                      {ev.description && (
                        <div className="text-[11px] text-[var(--ink-muted)]">{ev.description}</div>
                      )}
                      {ev.areaId && <AreaChip areaId={ev.areaId} showName />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[var(--hairline)] space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
              Próximos Marcos
            </h3>
            <div className="space-y-1.5">
              {upcomingItems.map((ev) => {
                const isComp = ev.category === "competition";
                const evHex = isComp
                  ? "#f59e0b"
                  : ev.areaId
                  ? getAreaMeta(ev.areaId).colorHex
                  : CATEGORY_META[ev.category].hex;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => jumpToDate(ev.date)}
                    style={
                      isComp
                        ? buildTintedCardStyle("#f59e0b", { active: true, emphasis: "medium" })
                        : undefined
                    }
                    className={`w-full text-left flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      isComp
                        ? "border font-semibold"
                        : "hover:bg-[var(--surface-2)] border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {isComp ? (
                        <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: evHex }}
                        />
                      )}
                      <span className="truncate">{ev.title}</span>
                    </span>
                    <span className="font-mono text-[10px] text-[var(--ink-muted)] shrink-0">
                      {ev.date.slice(5)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
