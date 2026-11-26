"use client";

import { useState } from "react";
import { Award, CalendarCheck, Camera, CheckCheck, Clock, MapPin, Plus, Save, Trash2, X } from "lucide-react";
import {
  computeAttendanceStats,
  computeMemberPoints,
  getAreaName,
  getMemberAreaRole,
  isTopLeadership,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import { AreaRoleBadge, PriorityBadge, RoleBadge, StatusBadge } from "./Badge";
import { MemberAvatar } from "./MemberAvatar";

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida"));
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function MemberProfileModal({
  memberId,
  onClose,
}: {
  memberId: string | null;
  onClose: () => void;
}) {
  const { state, currentUser, updateMemberProfile, updateMemberLabSlots } = useZeus();
  const member = state.members.find((m) => m.id === memberId) ?? null;

  const [editing, setEditing] = useState(false);
  const [course, setCourse] = useState("");
  const [bio, setBio] = useState("");
  const [labSchedule, setLabSchedule] = useState("");
  const [slotDay, setSlotDay] = useState(1);
  const [slotStart, setSlotStart] = useState("14:00");
  const [slotEnd, setSlotEnd] = useState("18:00");

  const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (!member) return null;

  const canEdit =
    !member.isGhost && (currentUser.id === member.id || isTopLeadership(currentUser.role));
  const points = computeMemberPoints(member.id, state.tasks);
  const myTasks = state.tasks.filter((t) => t.assigneeId === member.id);
  const approvedTasks = myTasks.filter((t) => t.meetingApproved);
  const att = computeAttendanceStats(member.id, state.attendance);

  const startEdit = () => {
    setCourse(member.course ?? "");
    setBio(member.bio ?? "");
    setLabSchedule(member.labSchedule ?? "");
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMemberProfile(member.id, {
      course: course.trim() || undefined,
      bio: bio.trim() || undefined,
      labSchedule: labSchedule.trim() || undefined,
    });
    setEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      updateMemberProfile(member.id, { avatarUrl: dataUrl });
    } catch {
      // ignore invalid image
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="zeus-card zeus-tab-enter w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="relative group shrink-0">
              <MemberAvatar member={member} size="lg" />
              {canEdit && (
                <label
                  title="Trocar foto de perfil"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer border-2 border-[var(--surface-1)]"
                >
                  <Camera className="h-3 w-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{member.fullName}</h2>
                {(!member.isGhost || member.roleConfirmed) && <RoleBadge role={member.role} />}
                {member.isGhost && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/45 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                    Fantasma · apenas demonstração
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--ink-subtle)]">
                {member.isGhost ? (
                  <>Conta ainda não cadastrada — exibindo somente nome e vínculos confirmados</>
                ) : (
                  <>
                    {member.email}
                    {member.course ? ` · ${member.course}` : ""}
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                    member.inLabNow
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                      : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  {member.inLabNow ? "Na sala agora" : "Fora da sala"}
                </span>
                {canEdit && (
                  <button
                    onClick={() =>
                      updateMemberProfile(member.id, { inLabNow: !member.inLabNow })
                    }
                    className="text-[11px] text-sky-400 hover:underline"
                  >
                    {member.inLabNow ? "Marcar saída" : "Marcar entrada na sala"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar perfil"
            className="rounded-lg border border-[var(--hairline)] p-1.5 text-[var(--ink-subtle)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Bio & Lab Schedule */}
        <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-3.5 space-y-2.5">
          {!editing ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  {member.bio || "Sem descrição no perfil ainda."}
                </p>
                {canEdit && (
                  <button
                    onClick={startEdit}
                    className="text-[11px] text-sky-400 hover:underline shrink-0"
                  >
                    Editar perfil
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--hairline)] text-[11px] text-[var(--ink-subtle)]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  Resumo de horários:{" "}
                  <strong className="text-[var(--ink)]">
                    {member.labSchedule || "Adicione suas janelas abaixo"}
                  </strong>
                </span>
              </div>

              {/* Grade de janelas automaticas */}
              <div className="pt-2 border-t border-[var(--hairline)] space-y-2">
                <div className="text-[11px] font-medium text-[var(--ink-subtle)]">
                  Janelas livres na faculdade (detecção automática de &ldquo;Na Sala Agora&rdquo;):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(member.labSlots ?? []).length === 0 ? (
                    <span className="text-[11px] text-[var(--ink-subtle)]">Nenhuma janela cadastrada.</span>
                  ) : (
                    (member.labSlots ?? []).map((slot, idx) => (
                      <span
                        key={`${slot.day}-${slot.start}-${idx}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] text-sky-300"
                      >
                        {WEEKDAY_SHORT[slot.day]} {slot.start}–{slot.end}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              updateMemberLabSlots(
                                member.id,
                                (member.labSlots ?? []).filter((_, i) => i !== idx)
                              )
                            }
                            className="hover:text-rose-400"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {canEdit && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <select
                      value={slotDay}
                      onChange={(e) => setSlotDay(Number(e.target.value))}
                      className="h-7 rounded border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-1.5 text-[11px]"
                    >
                      {WEEKDAY_SHORT.map((d, i) => (
                        <option key={d} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={slotStart}
                      onChange={(e) => setSlotStart(e.target.value)}
                      className="h-7 rounded border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-1.5 text-[11px]"
                    />
                    <span className="text-[11px] text-[var(--ink-subtle)]">até</span>
                    <input
                      type="time"
                      value={slotEnd}
                      onChange={(e) => setSlotEnd(e.target.value)}
                      className="h-7 rounded border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-1.5 text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateMemberLabSlots(member.id, [
                          ...(member.labSlots ?? []),
                          { day: slotDay, start: slotStart, end: slotEnd },
                        ])
                      }
                      className="h-7 inline-flex items-center gap-1 rounded bg-blue-600 hover:bg-blue-500 px-2 text-[11px] font-medium text-white"
                    >
                      <Plus className="h-3 w-3" /> Janela
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Curso / Universidade (ex.: Eng. Mecânica · UEMA)"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Horários livres no lab (ex.: Seg/Qua 14h–18h)"
                  value={labSchedule}
                  onChange={(e) => setLabSchedule(e.target.value)}
                  className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Breve bio técnica..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-[var(--hairline)] px-2.5 py-1 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold text-white"
                >
                  <Save className="h-3 w-3" /> Salvar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Areas with per-area roles */}
        <div className="flex flex-wrap gap-1.5">
          {member.areaIds.map((id) => {
            const areaRole = getMemberAreaRole(member, id) ?? "efetivado";
            return <AreaRoleBadge key={id} areaId={id} role={areaRole} />;
          })}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="zeus-surface-2 rounded-lg p-3 border border-[var(--hairline)]">
            <div className="text-[11px] text-[var(--ink-subtle)] flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-amber-500" /> Pontos no Ano
            </div>
            <div className="mt-1 font-mono text-lg font-semibold">{points} pts</div>
          </div>
          <div className="zeus-surface-2 rounded-lg p-3 border border-[var(--hairline)]">
            <div className="text-[11px] text-[var(--ink-subtle)] flex items-center gap-1">
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> Entregas Aprovadas
            </div>
            <div className="mt-1 font-mono text-lg font-semibold">{approvedTasks.length}</div>
          </div>
          <div className="zeus-surface-2 rounded-lg p-3 border border-[var(--hairline)]">
            <div className="text-[11px] text-[var(--ink-subtle)] flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5 text-blue-500" /> Presença
            </div>
            <div className="mt-1 font-mono text-lg font-semibold">
              {att.present}x ({att.rate}%)
            </div>
            <div className="text-[10px] text-[var(--ink-subtle)]">
              {att.justified} justif. · {att.absent} falta(s)
            </div>
          </div>
        </div>

        {/* Task History */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[var(--ink-subtle)] uppercase tracking-wider">
            Histórico de Sprints
          </h3>
          {myTasks.length === 0 ? (
            <div className="text-xs text-[var(--ink-subtle)]">Nenhuma tarefa atribuída ainda.</div>
          ) : (
            <div className="space-y-1.5">
              {myTasks.map((t) => {
                const sp = state.sprints.find((s) => s.id === t.sprintId);
                return (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--hairline)] p-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-[11px] text-[var(--ink-subtle)]">
                        {sp?.name ?? "Sprint"} · {getAreaName(t.areaId)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      {t.meetingApproved && (
                        <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px]">
                          Oficializado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
