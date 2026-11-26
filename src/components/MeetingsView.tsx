"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCheck,
  FileText,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  canApproveInMeeting,
  canManageArea,
  getAreaCardStyle,
  getAreaName,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { AttendanceStatus, MeetingType } from "@/lib/types";
import { AreaChip, PriorityBadge, RoleBadge } from "./Badge";
import { MemberAvatar } from "./MemberAvatar";

const ATTENDANCE_LABELS: Record<AttendanceStatus, { label: string; activeClass: string }> = {
  present: {
    label: "Presente",
    activeClass: "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
  },
  justified: {
    label: "Justificada",
    activeClass: "border-amber-500/50 bg-amber-500/15 text-amber-400",
  },
  absent: {
    label: "Falta",
    activeClass: "border-rose-500/50 bg-rose-500/15 text-rose-400",
  },
};

export function MeetingsView({
  onOpenProfile,
}: {
  onOpenProfile: (memberId: string) => void;
}) {
  const {
    state,
    currentUser,
    createMeeting,
    setAttendance,
    toggleMeetingApproval,
    returnTaskFromMeeting,
    addArchiveDocument,
    showToast,
  } = useZeus();

  const seasonMeetings = state.meetings.filter((m) => m.seasonYear === state.activeSeason);
  const [selectedMeetingId, setSelectedMeetingId] = useState(seasonMeetings[0]?.id ?? "");
  const [showForm, setShowForm] = useState(false);
  const [guidedMode, setGuidedMode] = useState(false);
  const [returnTaskId, setReturnTaskId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [minutesNotes, setMinutesNotes] = useState("");

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(`${state.activeSeason}-11-24`);
  const [type, setType] = useState<MeetingType>("general");
  const [areaId, setAreaId] = useState(currentUser.directorAreaIds[0] ?? "aerodinamica");

  const canCreateGeneral = canApproveInMeeting(currentUser);
  const manageableAreas = ZEUS_AREAS.filter((a) => canManageArea(currentUser, a.id));
  const canCreateAny = canCreateGeneral || manageableAreas.length > 0;

  const selectedMeeting =
    seasonMeetings.find((m) => m.id === selectedMeetingId) ?? seasonMeetings[0];

  const canEditSelected = selectedMeeting
    ? selectedMeeting.type === "general"
      ? canApproveInMeeting(currentUser)
      : Boolean(selectedMeeting.areaId && canManageArea(currentUser, selectedMeeting.areaId))
    : false;

  const participants = state.members.filter(
    (m) =>
      m.accountStatus === "approved" &&
      (selectedMeeting?.type === "general" ||
        (selectedMeeting?.areaId ? m.areaIds.includes(selectedMeeting.areaId) : false))
  );

  // Tasks in active season sprints that are directorValidated and awaiting meeting approval
  const seasonSprintIds = new Set(
    state.sprints.filter((sp) => sp.seasonYear === state.activeSeason).map((sp) => sp.id)
  );
  const pendingApprovalQueue = state.tasks.filter(
    (t) => seasonSprintIds.has(t.sprintId) && t.directorValidated && !t.meetingApproved
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const effectiveType = canCreateGeneral ? type : "area";
    createMeeting({
      title: title.trim(),
      date,
      type: effectiveType,
      areaId: effectiveType === "area" ? areaId : undefined,
    });
    setTitle("");
    setShowForm(false);
  };

  const handleGenerateAta = () => {
    if (!selectedMeeting) return;
    const presentCount = participants.filter((m) => {
      const rec = state.attendance.find(
        (a) => a.meetingId === selectedMeeting.id && a.memberId === m.id
      );
      return (rec?.status ?? "absent") === "present";
    }).length;

    const approvedInSeason = state.tasks.filter(
      (t) => seasonSprintIds.has(t.sprintId) && t.meetingApproved
    ).length;

    const summaryText = [
      `Data: ${selectedMeeting.date} · Presenças: ${presentCount}/${participants.length}.`,
      `Entregas oficializadas na temporada: ${approvedInSeason}.`,
      minutesNotes.trim() ? `Deliberações: ${minutesNotes.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    addArchiveDocument({
      seasonYear: state.activeSeason,
      areaId: selectedMeeting.areaId ?? "gestao",
      title: `Ata — ${selectedMeeting.title}`,
      docType: "ata",
      externalUrl: "https://teams.microsoft.com",
      summary: summaryText,
      impactedAreaIds: ["gestao"],
    });
    setMinutesNotes("");
    showToast("success", "Ata registrada no Acervo Histórico!");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Reuniões Quinzenais & Chamada ({state.activeSeason})
          </h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Faça a chamada, aprove entregas validadas pelos diretores no Modo Reunião e gere a Ata no Acervo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCreateGeneral && (
            <button
              type="button"
              onClick={() => setGuidedMode((v) => !v)}
              className={`zeus-btn inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold ${
                guidedMode
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-blue-500/40 bg-blue-500/15 text-sky-300"
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              {guidedMode ? "Sair do Modo Reunião" : `Modo Reunião (${pendingApprovalQueue.length})`}
            </button>
          )}
          {canCreateAny && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1 self-start rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
            >
              <Plus className="h-3.5 w-3.5" /> Nova Reunião
            </button>
          )}
        </div>
      </div>

      {/* Guided Meeting Mode */}
      {guidedMode && canCreateGeneral && (
        <section className="zeus-card rounded-xl p-4 border-emerald-500/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCheck className="h-4 w-4" />
                Modo Reunião Quinzenal Guiado — Fila de Aprovação ({pendingApprovalQueue.length})
              </h2>
              <p className="text-[11px] text-[var(--ink-subtle)]">
                Todas as entregas já validadas pelos diretores aguardando oficialização em reunião.
              </p>
            </div>
          </div>

          {pendingApprovalQueue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--hairline)] p-4 text-xs text-[var(--ink-subtle)] text-center">
              Nenhuma entrega aguardando aprovação na reunião agora.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingApprovalQueue.map((task) => {
                const assignee = state.members.find((m) => m.id === task.assigneeId);
                return (
                  <div
                    key={task.id}
                    className="rounded-xl border p-3 space-y-2"
                    style={getAreaCardStyle(task.areaId, { emphasis: "medium" })}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <AreaChip areaId={task.areaId} showName />
                          <PriorityBadge priority={task.priority} />
                          {assignee && (
                            <span className="text-[11px] text-[var(--ink-subtle)]">
                              · {assignee.fullName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold">{task.title}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleMeetingApproval(task.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1 text-xs font-semibold text-zinc-950"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReturnTaskId(returnTaskId === task.id ? null : task.id);
                            setReturnReason("");
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Devolver
                        </button>
                      </div>
                    </div>

                    {returnTaskId === task.id && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Motivo da devolução..."
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="flex-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            returnTaskFromMeeting(task.id, returnReason);
                            setReturnTaskId(null);
                          }}
                          className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950"
                        >
                          Confirmar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedMeeting && (
            <div className="pt-3 border-t border-[var(--hairline)] space-y-2">
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                Gerar Ata Automática de &ldquo;{selectedMeeting.title}&rdquo; no Acervo
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Resumo das decisões e próximos passos da reunião..."
                  value={minutesNotes}
                  onChange={(e) => setMinutesNotes(e.target.value)}
                  className="flex-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleGenerateAta}
                  className="rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shrink-0"
                >
                  Salvar Ata no Acervo
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {showForm && canCreateAny && (
        <form onSubmit={handleCreate} className="zeus-card rounded-lg p-4 space-y-3">
          <div className="text-sm font-semibold">Abrir lista de chamada</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              placeholder="Ex.: Reunião Quinzenal #14"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <select
              value={canCreateGeneral ? type : "area"}
              onChange={(e) => setType(e.target.value as MeetingType)}
              disabled={!canCreateGeneral}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              {canCreateGeneral && <option value="general">Reunião Geral da Equipe</option>}
              <option value="area">Reunião de Área</option>
            </select>
          </div>
          {(type === "area" || !canCreateGeneral) && (
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              {manageableAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  Área: {a.name}
                </option>
              ))}
            </select>
          )}
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
              className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950"
            >
              Criar Chamada
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Season Meetings List */}
        <div className="space-y-2">
          {seasonMeetings.length === 0 ? (
            <div className="zeus-card rounded-lg p-4 text-xs text-[var(--ink-subtle)] text-center">
              Nenhuma reunião em ZEUS {state.activeSeason}.
            </div>
          ) : (
            seasonMeetings.map((mt) => {
              const active = mt.id === selectedMeeting?.id;
              return (
                <button
                  key={mt.id}
                  onClick={() => setSelectedMeetingId(mt.id)}
                  style={
                    mt.areaId
                      ? getAreaCardStyle(mt.areaId, { active, emphasis: "medium" })
                      : undefined
                  }
                  className={`w-full text-left rounded-xl border p-3 space-y-1 transition-all ${
                    mt.areaId
                      ? active
                        ? "ring-1 ring-amber-400/70"
                        : "hover:brightness-105"
                      : active
                      ? "border-amber-500/60 bg-amber-500/10"
                      : "border-[var(--hairline)] bg-[var(--surface-1)] hover:border-[var(--hairline-strong)]"
                  }`}
                >
                  <div className="text-xs font-semibold">{mt.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--ink-subtle)]">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <CalendarDays className="h-3 w-3" /> {mt.date}
                    </span>
                    <span>
                      {mt.type === "general" ? "Geral" : getAreaName(mt.areaId ?? "")}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Roll-call Sheet */}
        <div className="lg:col-span-2 zeus-card rounded-lg p-4 space-y-3">
          {selectedMeeting ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{selectedMeeting.title}</h2>
                  <p className="text-xs text-[var(--ink-subtle)]">
                    {selectedMeeting.date} · {participants.length} membro(s)
                  </p>
                </div>
                {!canEditSelected && (
                  <span className="text-[11px] text-[var(--ink-subtle)]">Somente leitura</span>
                )}
              </div>

              <div className="divide-y divide-[var(--hairline)]">
                {participants.map((m) => {
                  const rec = state.attendance.find(
                    (a) => a.meetingId === selectedMeeting.id && a.memberId === m.id
                  );
                  const currentStatus: AttendanceStatus = rec?.status ?? "absent";
                  return (
                    <div
                      key={m.id}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenProfile(m.id)}
                        className="flex items-center gap-2 hover:text-amber-400 text-left"
                      >
                        <MemberAvatar member={m} size="sm" />
                        <span className="text-xs font-medium">{m.fullName}</span>
                        <RoleBadge role={m.role} />
                      </button>
                      <div className="flex items-center gap-1.5">
                        {(["present", "justified", "absent"] as AttendanceStatus[]).map((st) => {
                          const active = currentStatus === st;
                          return (
                            <button
                              key={st}
                              disabled={!canEditSelected}
                              onClick={() => setAttendance(selectedMeeting.id, m.id, st)}
                              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                                active
                                  ? ATTENDANCE_LABELS[st].activeClass
                                  : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                              }`}
                            >
                              {ATTENDANCE_LABELS[st].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-xs text-[var(--ink-subtle)] py-6 text-center">
              Nenhuma reunião cadastrada nesta temporada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
