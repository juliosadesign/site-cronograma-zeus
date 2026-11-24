"use client";

import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Megaphone,
  Pin,
  Plus,
  Users,
} from "lucide-react";
import {
  canManageAnnouncements,
  computeAttendanceStats,
  computeTeamReportPercentage,
  getAreaCode,
  getAreaName,
  PRIORITY_META,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import { AreaChip, PriorityBadge, StatusBadge } from "./Badge";
import {
  GaugeRing,
  ReportsBarChart,
  SprintAreaChart,
  StatusDonutChart,
} from "./Charts";
import type { NavTab } from "./AppShell";

export function DashboardView({ onNavigate }: { onNavigate: (tab: NavTab) => void }) {
  const { state, currentUser, createAnnouncement, togglePinAnnouncement } = useZeus();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(true);

  const activeSprint = state.sprints.find((s) => s.isActive) ?? state.sprints[0];
  const activeTasks = state.tasks.filter((t) => t.sprintId === activeSprint?.id);
  const approvedInSprint = activeTasks.filter((t) => t.meetingApproved).length;
  const awaitingMeeting = activeTasks.filter((t) => t.directorValidated && !t.meetingApproved).length;

  const greenCount = activeTasks.filter((t) => t.status === "green").length;
  const yellowCount = activeTasks.filter((t) => t.status === "yellow").length;
  const redCount = activeTasks.filter((t) => t.status === "red").length;

  const { teamPercentage, byArea } = computeTeamReportPercentage(
    ZEUS_AREAS,
    state.reportSections,
    state.reportOverrides
  );

  const approvedMembers = state.members.filter((m) => m.accountStatus === "approved");
  const pendingMembers = state.members.filter((m) => m.accountStatus === "pending").length;
  const avgAttendanceRate =
    approvedMembers.length === 0
      ? 0
      : Math.round(
          approvedMembers.reduce(
            (sum, m) => sum + computeAttendanceStats(m.id, state.attendance).rate,
            0
          ) / approvedMembers.length
        );

  const sprintTimeline = [...state.sprints]
    .reverse()
    .map((sp) => {
      const pts = state.tasks
        .filter((t) => t.sprintId === sp.id && t.meetingApproved)
        .reduce((acc, t) => acc + PRIORITY_META[t.priority].points, 0);
      return {
        label: sp.name.split("—")[0].trim(),
        value: pts,
        subtitle: sp.name,
      };
    });

  const crossAreaTasks = activeTasks.filter((t) => t.impactedAreaIds.length > 0).slice(0, 3);
  const sortedAnnouncements = [...state.announcements].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned)
  );
  const canPost = canManageAnnouncements(currentUser);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createAnnouncement({ title: title.trim(), content: content.trim(), pinned });
    setTitle("");
    setContent("");
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview · Zeus AeroDesign</h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            {activeSprint
              ? `${activeSprint.name} (${activeSprint.startDate} → ${activeSprint.endDate})`
              : "Nenhuma sprint ativa — crie uma na aba Sprints"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("areas")}
            className="zeus-btn inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium hover:border-blue-500/60"
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" /> Relatórios
          </button>
          <button
            onClick={() => onNavigate("sprints")}
            className="zeus-btn inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Abrir Sprints <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="zeus-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Entregas da Sprint</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono">
              {approvedInSprint}/{activeTasks.length}
            </span>
            <span className="text-[11px] text-sky-400 font-mono">
              +{awaitingMeeting} p/ reunião
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Oficializadas na sprint atual</div>
        </div>

        <div className="zeus-card rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--ink-subtle)]">Relatório Geral da Equipe</div>
            <div className="mt-2 text-2xl font-semibold font-mono text-amber-400">
              {teamPercentage}%
            </div>
            <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Média das 11 áreas SAE</div>
          </div>
          <GaugeRing percentage={teamPercentage} />
        </div>

        <div className="zeus-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Membros Ativos</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono">{approvedMembers.length}</span>
            {pendingMembers > 0 && (
              <span className="text-[11px] text-amber-400 font-mono">
                {pendingMembers} pendente(s)
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Contas aprovadas</div>
        </div>

        <div className="zeus-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Presença Quinzenal</span>
            <CalendarCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono">{avgAttendanceRate}%</span>
            <span className="text-[11px] text-[var(--ink-subtle)] font-mono">
              {state.meetings.length} reuniões
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Média de presença geral</div>
        </div>
      </div>

      {/* Main Visual Row: Area Chart + Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 zeus-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Evolução de Pontos por Sprint</h2>
              <p className="text-[11px] text-[var(--ink-subtle)]">
                Pontos ponderados oficializados nas reuniões quinzenais
              </p>
            </div>
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 font-mono text-[10px] text-sky-400">
              Ciclo 2026
            </span>
          </div>
          <SprintAreaChart
            points={
              sprintTimeline.length > 0
                ? sprintTimeline
                : [{ label: "Início", value: 0, subtitle: "Sem sprints cadastradas" }]
            }
          />
        </section>

        <section className="zeus-card rounded-xl p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Status da Sprint Atual</h2>
            <p className="text-[11px] text-[var(--ink-subtle)]">
              Distribuição visual das entregas
            </p>
          </div>
          <StatusDonutChart green={greenCount} yellow={yellowCount} red={redCount} />
        </section>
      </div>

      {/* Second Row: 11 Areas Report Bar Chart + Mural & Dependências */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 zeus-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                Progresso dos Relatórios SAE por Área
              </h2>
              <p className="text-[11px] text-[var(--ink-subtle)]">
                Comparativo individual de cada relatório frente à média geral ({teamPercentage}%)
              </p>
            </div>
            <button
              onClick={() => onNavigate("areas")}
              className="text-xs text-sky-400 hover:underline"
            >
              Editar checklists
            </button>
          </div>

          <ReportsBarChart items={byArea} teamAverage={teamPercentage} />

          {/* Cross-area dependency radar */}
          <div className="pt-2 border-t border-[var(--hairline)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Conexões entre Áreas (base para o Grafo V2)</span>
              <span className="font-mono text-[10px] text-[var(--ink-subtle)]">
                Impacto nos relatórios
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {crossAreaTasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/60 p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-semibold text-amber-400">
                      {getAreaCode(t.areaId)} → {t.impactedAreaIds.map(getAreaCode).join(", ")}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="text-[11px] font-medium line-clamp-2">{t.title}</div>
                  <div className="flex items-center justify-between gap-1">
                    <PriorityBadge priority={t.priority} />
                    <span className="text-[10px] text-[var(--ink-subtle)] truncate">
                      {getAreaName(t.areaId)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mural de Avisos */}
        <section className="zeus-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-400" />
              Mural de Avisos
            </h2>
            {canPost && (
              <button
                onClick={() => setShowForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-[11px] font-medium hover:border-amber-500/50"
              >
                <Plus className="h-3 w-3" /> Aviso
              </button>
            )}
          </div>

          {showForm && canPost && (
            <form
              onSubmit={handlePost}
              className="zeus-surface-2 rounded-lg p-3 border border-[var(--hairline)] space-y-2"
            >
              <input
                type="text"
                placeholder="Título do comunicado..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
              />
              <textarea
                rows={2}
                placeholder="Mensagem para a equipe..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
              />
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ink-subtle)]">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                  />
                  Fixar
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-zinc-950"
                >
                  Publicar
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {sortedAnnouncements.map((ann) => {
              const author = state.members.find((m) => m.id === ann.authorId);
              return (
                <div
                  key={ann.id}
                  className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/60 p-3 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      {ann.pinned && <Pin className="h-3 w-3 text-amber-400 shrink-0" />}
                      {ann.title}
                    </div>
                    {canPost && (
                      <button
                        onClick={() => togglePinAnnouncement(ann.id)}
                        className="text-[10px] text-[var(--ink-subtle)] hover:text-amber-400 shrink-0"
                      >
                        {ann.pinned ? "Desafixar" : "Fixar"}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">{ann.content}</p>
                  <div className="text-[10px] text-[var(--ink-subtle)] font-mono">
                    {author?.fullName ?? "Liderança"} · {ann.createdAt}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex flex-wrap gap-1">
            {ZEUS_AREAS.map((a) => (
              <AreaChip key={a.id} areaId={a.id} subtle />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
