"use client";

import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import {
  canApproveInMeeting,
  canManageArea,
  getAreaName,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { AttendanceStatus, MeetingType } from "@/lib/types";
import { RoleBadge } from "./Badge";

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

export function MeetingsView() {
  const { state, currentUser, createMeeting, setAttendance } = useZeus();
  const [selectedMeetingId, setSelectedMeetingId] = useState(state.meetings[0]?.id ?? "");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-11-24");
  const [type, setType] = useState<MeetingType>("general");
  const [areaId, setAreaId] = useState(currentUser.directorAreaIds[0] ?? "aerodinamica");

  const canCreateGeneral = canApproveInMeeting(currentUser);
  const manageableAreas = ZEUS_AREAS.filter((a) => canManageArea(currentUser, a.id));
  const canCreateAny = canCreateGeneral || manageableAreas.length > 0;

  const selectedMeeting =
    state.meetings.find((m) => m.id === selectedMeetingId) ?? state.meetings[0];

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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reuniões Quinzenais & Chamada</h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Cada presença registrada alimenta automaticamente o contador e a taxa no perfil dos membros.
          </p>
        </div>

        {canCreateAny && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1 self-start rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
          >
            <Plus className="h-3.5 w-3.5" /> Nova Reunião
          </button>
        )}
      </div>

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
        {/* Meetings List */}
        <div className="space-y-2">
          {state.meetings.map((mt) => {
            const active = mt.id === selectedMeeting?.id;
            return (
              <button
                key={mt.id}
                onClick={() => setSelectedMeetingId(mt.id)}
                className={`w-full text-left rounded-lg border p-3 space-y-1 transition-colors ${
                  active
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
          })}
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{m.fullName}</span>
                        <RoleBadge role={m.role} />
                      </div>
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
              Nenhuma reunião cadastrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
