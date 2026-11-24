"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Flame,
  MapPin,
  Megaphone,
  Pin,
  Plus,
  Trophy,
} from "lucide-react";
import {
  canManageAnnouncements,
  computeAttendanceStats,
  computeDaysUntil,
  computeTeamReportPercentage,
  evaluateScheduleHealth,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import { AircraftBlueprint3D } from "./AircraftBlueprint3D";
import { AreaChip, RoleBadge } from "./Badge";
import {
  AreaHealthHeatmap,
  ForecastCurveChart,
  GaugeRing,
  MiniSparkline,
  ReportsBarChart,
  StatusDonutChart,
} from "./Charts";
import { MemberAvatar } from "./MemberAvatar";
import type { NavTab } from "./AppShell";

export function DashboardView({
  onNavigate,
  onOpenProfile,
}: {
  onNavigate: (tab: NavTab) => void;
  onOpenProfile: (memberId: string) => void;
}) {
  const { state, currentUser, createAnnouncement, togglePinAnnouncement, toggleMyLabPresence } =
    useZeus();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(true);

  const [todayIso, setTodayIso] = useState<string | null>(null);
  useEffect(() => {
    setTodayIso(new Date().toISOString().slice(0, 10));
  }, []);

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
  const membersInLab = approvedMembers.filter((m) => m.inLabNow);
  const daysUntilComp = todayIso ? computeDaysUntil(state.competitionDate, todayIso) : null;
  const scheduleHealth =
    daysUntilComp !== null ? evaluateScheduleHealth(teamPercentage, daysUntilComp) : null;

  const avgAttendanceRate =
    approvedMembers.length === 0
      ? 0
      : Math.round(
          approvedMembers.reduce(
            (sum, m) => sum + computeAttendanceStats(m.id, state.attendance).rate,
            0
          ) / approvedMembers.length
        );

  const heatmapRows = byArea.map((item) => {
    const areaTasks = activeTasks.filter((t) => t.areaId === item.areaId);
    const sprintPct =
      areaTasks.length === 0
        ? item.percentage
        : Math.round(
            (areaTasks.filter((t) => t.status === "green").length / areaTasks.length) * 100
          );
    const linksCount =
      state.reportSections.filter(
        (r) => r.areaId === item.areaId || r.impactedAreaIds.includes(item.areaId)
      ).length +
      state.tasks.filter(
        (t) => t.areaId === item.areaId || t.impactedAreaIds.includes(item.areaId)
      ).length;
    return {
      areaId: item.areaId,
      reportPct: item.percentage,
      sprintPct,
      linksCount,
    };
  });

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
          <h1 className="text-xl font-semibold tracking-tight">Central de Telemetria · Zeus</h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            {activeSprint
              ? `${activeSprint.name} (${activeSprint.startDate} → ${activeSprint.endDate})`
              : "Nenhuma sprint ativa — crie uma na aba Sprints"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("calendar")}
            className="zeus-btn inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium hover:border-amber-500/60"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-500" /> Calendário
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
        <button
          onClick={() => onNavigate("calendar")}
          className="zeus-card zeus-card-interactive text-left rounded-xl p-4 border-amber-500/40"
        >
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Competição SAE Brasil</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-bold text-amber-400">
              {daysUntilComp === null
                ? "—"
                : daysUntilComp > 0
                ? `${daysUntilComp}d`
                : daysUntilComp === 0
                ? "Hoje!"
                : "Encerrada"}
            </span>
            {scheduleHealth && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  scheduleHealth.status === "ahead"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                    : scheduleHealth.status === "on_track"
                    ? "border-sky-500/40 bg-sky-500/15 text-sky-400"
                    : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                }`}
              >
                {scheduleHealth.label}
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">
            SJC · {state.competitionDate}
          </div>
        </button>

        <div className="zeus-card rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--ink-subtle)]">Relatório Geral da Equipe</div>
            <div className="mt-2 text-2xl font-semibold font-mono text-amber-400">
              {teamPercentage}%
            </div>
            <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">
              Meta hoje: {scheduleHealth ? `${scheduleHealth.targetPct}%` : "—"}
            </div>
          </div>
          <GaugeRing percentage={teamPercentage} />
        </div>

        <div className="zeus-card rounded-xl p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-[var(--ink-subtle)]">Entregas da Sprint</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold font-mono">
                {approvedInSprint}/{activeTasks.length}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">
                +{awaitingMeeting} val.
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Oficializadas na reunião</div>
          </div>
          <MiniSparkline values={[1, 2, 2, Math.max(1, approvedInSprint + awaitingMeeting)]} color="#10b981" />
        </div>

        <div className="zeus-card rounded-xl p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-[var(--ink-subtle)]">Presença Quinzenal</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold font-mono">{avgAttendanceRate}%</span>
              <span className="text-[11px] text-sky-400 font-mono">
                {state.meetings.length} reun.
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Frequência média</div>
          </div>
          <MiniSparkline values={[78, 82, 85, avgAttendanceRate || 80]} color="#38bdf8" />
        </div>
      </div>

      {/* Row 1: Simulador de Previsão & Metas + Visor 3D Conceitual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 zeus-card rounded-xl p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Previsão & Metas até a Competição</h2>
            <p className="text-[11px] text-[var(--ink-subtle)]">
              Simule marcos como &ldquo;faltando 200 dias&rdquo; e veja se a equipe está adiantada, no prazo ou atrasada em relação à curva ideal SAE.
            </p>
          </div>
          <ForecastCurveChart actualPct={teamPercentage} currentDaysRemaining={daysUntilComp} />
        </section>

        <AircraftBlueprint3D />
      </div>

      {/* Row 2: Heatmap das 11 Áreas + Ranking de Relatórios & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 zeus-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                Mapa de Calor das 11 Áreas
              </h2>
              <p className="text-[11px] text-[var(--ink-subtle)]">
                Saúde combinada de Relatório, Sprint atual e conexões entre áreas
              </p>
            </div>
            <button
              onClick={() => onNavigate("areas")}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              <FileText className="h-3.5 w-3.5" /> Abrir Áreas
            </button>
          </div>
          <AreaHealthHeatmap rows={heatmapRows} onSelectArea={() => onNavigate("areas")} />
        </section>

        <div className="space-y-4">
          <section className="zeus-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Top Relatórios
              </h2>
              <span className="font-mono text-[10px] text-amber-400">Média {teamPercentage}%</span>
            </div>
            <ReportsBarChart items={byArea} teamAverage={teamPercentage} />
          </section>

          <section className="zeus-card rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold">Entregas da Sprint Atual</h2>
            <StatusDonutChart green={greenCount} yellow={yellowCount} red={redCount} />
          </section>
        </div>
      </div>

      {/* Row 3: Na Sala Agora + Mural de Avisos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 zeus-card rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Na Sala Agora ({membersInLab.length})
              </h2>
              <p className="text-[11px] text-[var(--ink-subtle)]">
                Membros no laboratório e janelas previstas pela grade horária
              </p>
            </div>
            <button
              onClick={toggleMyLabPresence}
              className={`zeus-btn rounded-md border px-2.5 py-1 text-xs font-medium ${
                currentUser.inLabNow
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  : "border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--ink-muted)]"
              }`}
            >
              {currentUser.inLabNow ? "Sair da sala" : "Estou na sala"}
            </button>
          </div>

          {membersInLab.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--hairline)] p-4 text-xs text-[var(--ink-subtle)] text-center">
              Ninguém marcado na sala neste momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {membersInLab.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onOpenProfile(m.id)}
                  className="zeus-card-interactive text-left rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5 flex items-center gap-3"
                >
                  <MemberAvatar member={m} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">{m.fullName}</span>
                      <RoleBadge role={m.role} />
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--ink-subtle)] truncate">
                      {m.labSchedule || "Horário não informado"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="zeus-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-500" />
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
                  className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white"
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
                      {ann.pinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
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
