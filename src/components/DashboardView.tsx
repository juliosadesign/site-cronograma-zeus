"use client";

import { useEffect, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  Cpu,
  FileText,
  Filter,
  Flame,
  MapPin,
  Megaphone,
  Palette,
  Pin,
  Plane,
  Plus,
  Trophy,
} from "lucide-react";
import {
  canManageAnnouncements,
  computeAttendanceStats,
  computeDaysUntil,
  computeFlightReadiness,
  computeTeamReportPercentage,
  CORPORATE_AREAS,
  evaluateScheduleHealth,
  getAreaCardStyle,
  getAreaMeta,
  getMemberLabStatus,
  isDateInPeriod,
  TECHNICAL_AREAS,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { PeriodFilter } from "@/lib/types";
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
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");

  const [nowInfo, setNowInfo] = useState<{ iso: string; dayOfWeek: number; minutes: number } | null>(null);
  useEffect(() => {
    const now = new Date();
    setNowInfo({
      iso: now.toISOString().slice(0, 10),
      dayOfWeek: now.getDay(),
      minutes: now.getHours() * 60 + now.getMinutes(),
    });
  }, []);

  const seasonSprints = state.sprints.filter(
    (s) => s.seasonYear === state.activeSeason && isDateInPeriod(s.startDate, periodFilter)
  );
  const fallbackSeasonSprints = state.sprints.filter((s) => s.seasonYear === state.activeSeason);
  const activeSprint =
    seasonSprints.find((s) => s.isActive) ??
    seasonSprints[seasonSprints.length - 1] ??
    fallbackSeasonSprints.find((s) => s.isActive);
  const seasonSprintIds = new Set(seasonSprints.map((s) => s.id));
  const seasonTasks = state.tasks.filter((t) => seasonSprintIds.has(t.sprintId));
  const activeTasks = activeSprint
    ? state.tasks.filter((t) => t.sprintId === activeSprint.id)
    : [];
  const approvedInSprint = activeTasks.filter((t) => t.meetingApproved).length;
  const awaitingMeeting = activeTasks.filter((t) => t.directorValidated && !t.meetingApproved).length;
  const blockedTasks = activeTasks.filter((t) => Boolean(t.blockedByAreaId || t.blockedReason));

  const greenCount = activeTasks.filter((t) => t.status === "green").length;
  const yellowCount = activeTasks.filter((t) => t.status === "yellow").length;
  const redCount = activeTasks.filter((t) => t.status === "red").length;

  const seasonReports = state.reportSections.filter(
    (r) => r.seasonYear === state.activeSeason
  );
  const seasonMeetings = state.meetings.filter(
    (m) => m.seasonYear === state.activeSeason && isDateInPeriod(m.date, periodFilter)
  );
  const seasonMeetingIds = new Set(seasonMeetings.map((m) => m.id));
  const seasonAttendance = state.attendance.filter((a) => seasonMeetingIds.has(a.meetingId));

  const seasonAnnouncements = state.announcements.filter(
    (a) => a.seasonYear === state.activeSeason && isDateInPeriod(a.createdAt, periodFilter)
  );

  // Compute SAE Technical Report % strictly over the 8 Technical Areas (Corporate stays separated)
  const { teamPercentage, byArea } = computeTeamReportPercentage(
    TECHNICAL_AREAS,
    seasonReports,
    state.reportOverrides,
    state.activeSeason
  );

  const seasonChecklist = state.flightChecklist.filter((f) => f.seasonYear === state.activeSeason);
  const flightReadiness = computeFlightReadiness(seasonChecklist);
  const unresolvedCriticalLessons = state.competitionLessons.filter(
    (l) => l.seasonYear === state.activeSeason && !l.resolved && l.severity === "critico"
  ).length;

  const approvedMembers = state.members.filter((m) => m.accountStatus === "approved");
  const labEntries = approvedMembers
    .map((m) => ({
      member: m,
      labStatus: nowInfo
        ? getMemberLabStatus(m, nowInfo.dayOfWeek, nowInfo.minutes)
        : m.inLabNow
        ? ("checked_in" as const)
        : ("away" as const),
    }))
    .filter((entry) => entry.labStatus !== "away");
  const daysUntilComp = nowInfo ? computeDaysUntil(state.competitionDate, nowInfo.iso) : null;
  const scheduleHealth =
    daysUntilComp !== null ? evaluateScheduleHealth(teamPercentage, daysUntilComp) : null;

  const avgAttendanceRate =
    approvedMembers.length === 0 || seasonMeetings.length === 0
      ? 0
      : Math.round(
          approvedMembers.reduce(
            (sum, m) => sum + computeAttendanceStats(m.id, seasonAttendance).rate,
            0
          ) / approvedMembers.length
        );

  // Real computed sparkline series from season sprints & meetings
  const sprintApprovalSeries = [...fallbackSeasonSprints]
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((sp) => state.tasks.filter((t) => t.sprintId === sp.id && t.meetingApproved).length);
  const attendanceSeries = [...seasonMeetings]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((mt) => {
      const recs = seasonAttendance.filter((a) => a.meetingId === mt.id);
      if (recs.length === 0) return 0;
      const present = recs.filter((a) => a.status === "present").length;
      return Math.round((present / recs.length) * 100);
    });

  const heatmapRows = ZEUS_AREAS.map((area) => {
    const areaReport = byArea.find((b) => b.areaId === area.id);
    const areaTasks = activeTasks.filter((t) => t.areaId === area.id);
    const sprintPct =
      areaTasks.length === 0
        ? (areaReport?.percentage ?? 0)
        : Math.round(
            (areaTasks.filter((t) => t.status === "green").length / areaTasks.length) * 100
          );
    const linksCount =
      seasonReports.filter(
        (r) => r.areaId === area.id || r.impactedAreaIds.includes(area.id)
      ).length +
      seasonTasks.filter(
        (t) => t.areaId === area.id || t.impactedAreaIds.includes(area.id)
      ).length;
    return {
      areaId: area.id,
      reportPct: areaReport?.percentage ?? sprintPct,
      sprintPct,
      linksCount,
    };
  });

  const sortedAnnouncements = [...seasonAnnouncements].sort(
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Central de Telemetria · Zeus {state.activeSeason}
            </h1>
            <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono text-blue-400">
              {seasonSprints.length} sprints no recorte
            </span>
          </div>
          <p className="text-xs text-[var(--ink-subtle)]">
            {activeSprint
              ? `${activeSprint.name} (${activeSprint.startDate} → ${activeSprint.endDate})`
              : `Nenhuma sprint no período selecionado em ${state.activeSeason}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate("flight")}
            className="zeus-btn inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium hover:border-blue-500/60"
          >
            <Plane className="h-3.5 w-3.5 text-sky-400" />
            Prontidão {flightReadiness.percentage}%
            {unresolvedCriticalLessons > 0 && (
              <span className="ml-0.5 inline-flex items-center gap-0.5 text-rose-400 font-mono">
                · <AlertTriangle className="h-3 w-3" /> {unresolvedCriticalLessons}
              </span>
            )}
          </button>
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

      {/* Period Filter Bar */}
      <div className="zeus-card rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-[var(--ink-subtle)]">
          <Filter className="h-3.5 w-3.5 text-blue-400" />
          <span>Recorte temporal ({state.activeSeason}):</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: "Ano todo" },
              { id: "q1", label: "Jan–Mar" },
              { id: "h1", label: "Até Junho (Jan–Jun)" },
              { id: "q3", label: "Jul–Set" },
              { id: "q4", label: "Out–Dez" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPeriodFilter(opt.id)}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                periodFilter === opt.id
                  ? "border-blue-500/70 bg-blue-600/20 text-blue-300"
                  : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Sprint Blockers Alert */}
      {blockedTasks.length > 0 && (
        <div className="zeus-card rounded-xl p-3.5 border-rose-500/45 bg-rose-500/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-rose-300">
                {blockedTasks.length} entrega(s) bloqueada(s) na Sprint atual
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-[var(--ink-muted)]">
                {blockedTasks.map((bt) => (
                  <span key={bt.id} className="inline-flex items-center gap-1.5">
                    <AreaChip areaId={bt.areaId} />
                    <span>→ aguarda</span>
                    {bt.blockedByAreaId && <AreaChip areaId={bt.blockedByAreaId} />}
                    <span className="truncate max-w-[220px]">({bt.title})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("sprints")}
            className="self-start sm:self-center rounded-md border border-rose-500/40 bg-rose-500/15 px-2.5 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/25 shrink-0"
          >
            Resolver bloqueios
          </button>
        </div>
      )}

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
            <div className="text-xs text-[var(--ink-subtle)]">Relatório Técnico (8 áreas)</div>
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
          <MiniSparkline
            values={sprintApprovalSeries.length >= 2 ? sprintApprovalSeries : [0, approvedInSprint]}
            color="#10b981"
          />
        </div>

        <div className="zeus-card rounded-xl p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-[var(--ink-subtle)]">Presença Quinzenal</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold font-mono">{avgAttendanceRate}%</span>
              <span className="text-[11px] text-sky-400 font-mono">
                {seasonMeetings.length} reun.
              </span>
            </div>
            <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Frequência média</div>
          </div>
          <MiniSparkline
            values={attendanceSeries.length >= 2 ? attendanceSeries : [0, avgAttendanceRate]}
            color="#38bdf8"
          />
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
          <AreaHealthHeatmap
            rows={heatmapRows}
            onSelectArea={(areaId) => {
              const meta = getAreaMeta(areaId);
              onNavigate(meta.category === "corporate" ? (areaId as NavTab) : "areas");
            }}
          />
        </section>

        <div className="space-y-4">
          <section className="zeus-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Top Relatórios Técnicos
              </h2>
              <span className="font-mono text-[10px] text-amber-400">Média {teamPercentage}%</span>
            </div>
            <ReportsBarChart items={byArea} />
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
                Na Sala Agora ({labEntries.length})
              </h2>
              <p className="text-[11px] text-[var(--ink-subtle)]">
                Check-in manual + janelas livres da grade da faculdade neste horário
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

          {labEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--hairline)] p-4 text-xs text-[var(--ink-subtle)] text-center">
              Ninguém marcado na sala nem previsto pela grade neste horário.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {labEntries.map(({ member: m, labStatus }) => (
                <button
                  key={m.id}
                  onClick={() => onOpenProfile(m.id)}
                  className="zeus-card-interactive text-left rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5 flex items-center gap-3"
                >
                  <MemberAvatar member={m} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold truncate">{m.fullName}</span>
                      <span
                        className={`rounded-full border px-1.5 py-0.2 text-[9px] font-medium shrink-0 ${
                          labStatus === "checked_in"
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                            : "border-sky-500/40 bg-sky-500/15 text-sky-400"
                        }`}
                      >
                        {labStatus === "checked_in" ? "Confirmado" : "Pela grade"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <RoleBadge role={m.role} />
                      <span className="text-[10px] text-[var(--ink-subtle)] truncate">
                        {m.labSchedule || ""}
                      </span>
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
        </section>
      </div>

      {/* Row 4: Mapa de Cores das Áreas (Guia visual permanente para novos membros) */}
      <section className="zeus-card rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4 text-sky-400" />
              Mapa de Cores das Áreas · Guia Visual da Equipe
            </h2>
            <p className="text-[11px] text-[var(--ink-subtle)]">
              Cada cor identifica instantaneamente a área responsável nas Sprints, no Grafo Obsidian, no Acervo e nos Relatórios.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-subtle)] flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-sky-400" />
              Áreas Técnicas SAE ({TECHNICAL_AREAS.length})
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TECHNICAL_AREAS.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => onNavigate("areas")}
                  className="zeus-area-card text-left rounded-xl border-[1.5px] p-3 space-y-1.5"
                  style={getAreaCardStyle(area.id, { emphasis: "strong" })}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${area.chipClass}`}
                    >
                      {area.shortCode}
                    </span>
                    <span
                      className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white/25 dark:ring-black/30"
                      style={{ backgroundColor: area.colorHex }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-[var(--ink)] truncate">{area.name}</div>
                  <div className="text-[10px] text-[var(--ink-muted)] line-clamp-2">
                    {area.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-amber-400" />
              Divisão Corporativa / Empresarial ({CORPORATE_AREAS.length})
            </div>
            <div className="space-y-2.5">
              {CORPORATE_AREAS.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => onNavigate(area.id as NavTab)}
                  className="zeus-area-card w-full text-left rounded-xl border-[1.5px] p-3 flex items-start gap-2.5"
                  style={getAreaCardStyle(area.id, { emphasis: "strong" })}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0 mt-0.5 ring-2 ring-white/25 dark:ring-black/30"
                    style={{ backgroundColor: area.colorHex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[var(--ink)]">{area.name}</span>
                      <span
                        className={`rounded border px-1.5 py-0.2 font-mono text-[10px] font-bold ${area.chipClass}`}
                      >
                        {area.shortCode}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">{area.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
