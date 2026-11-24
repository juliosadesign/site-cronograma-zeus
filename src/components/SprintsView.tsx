"use client";

import { useState } from "react";
import { Check, CheckCheck, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  canApproveInMeeting,
  canManageArea,
  canUpdateTaskStatus,
  getAreaName,
  PRIORITY_META,
  TASK_STATUS_META,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { Priority, TaskStatus } from "@/lib/types";
import { AreaChip, PriorityBadge, RoleBadge } from "./Badge";
import { MemberAvatar } from "./MemberAvatar";

export function SprintsView({
  onOpenProfile,
}: {
  onOpenProfile: (memberId: string) => void;
}) {
  const {
    state,
    currentUser,
    updateTaskStatus,
    toggleDirectorValidation,
    toggleMeetingApproval,
    createTask,
    deleteTask,
    createSprint,
    deleteSprint,
  } = useZeus();

  const activeSprint = state.sprints.find((s) => s.isActive) ?? state.sprints[0];
  const [selectedSprintId, setSelectedSprintId] = useState(activeSprint?.id ?? "");
  const [confirmDeleteSprint, setConfirmDeleteSprint] = useState(false);

  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState(currentUser.areaIds[0] ?? "aerodinamica");
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [priority, setPriority] = useState<Priority>("high");
  const [externalUrl, setExternalUrl] = useState("");
  const [impactedAreaIds, setImpactedAreaIds] = useState<string[]>([]);

  const [sprintName, setSprintName] = useState("");
  const [sprintStart, setSprintStart] = useState("2026-11-25");
  const [sprintEnd, setSprintEnd] = useState("2026-12-09");

  const effectiveSprintId = state.sprints.some((sp) => sp.id === selectedSprintId)
    ? selectedSprintId
    : (activeSprint?.id ?? "");

  const approvedMembers = state.members.filter((m) => m.accountStatus === "approved");
  const canManageSprints = canApproveInMeeting(currentUser);
  const canCreateAnyTask = ZEUS_AREAS.some((a) => canManageArea(currentUser, a.id));

  const filteredTasks = state.tasks.filter((t) => {
    if (effectiveSprintId && t.sprintId !== effectiveSprintId) return false;
    if (areaFilter !== "all" && t.areaId !== areaFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !effectiveSprintId) return;
    createTask({
      sprintId: effectiveSprintId,
      areaId,
      assigneeId,
      title: title.trim(),
      description: description.trim(),
      priority,
      externalUrl: externalUrl.trim() || undefined,
      impactedAreaIds: impactedAreaIds.filter((id) => id !== areaId),
    });
    setTitle("");
    setDescription("");
    setExternalUrl("");
    setImpactedAreaIds([]);
    setShowTaskForm(false);
  };

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;
    createSprint({ name: sprintName.trim(), startDate: sprintStart, endDate: sprintEnd });
    setSprintName("");
    setShowSprintForm(false);
  };

  const handleDeleteSprint = () => {
    if (!effectiveSprintId) return;
    deleteSprint(effectiveSprintId);
    setConfirmDeleteSprint(false);
  };

  const toggleImpacted = (id: string) => {
    setImpactedAreaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sprints & Entregas</h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Fluxo: Membro (Vermelho/Amarelo/Verde) → Diretor valida → Capitão/Dev aprova na reunião.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageSprints && (
            <button
              onClick={() => setShowSprintForm((v) => !v)}
              className="zeus-btn inline-flex items-center gap-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium hover:border-blue-500/50"
            >
              <Plus className="h-3.5 w-3.5" /> Nova Sprint
            </button>
          )}
          {canCreateAnyTask && effectiveSprintId && (
            <button
              onClick={() => setShowTaskForm((v) => !v)}
              className="zeus-btn inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Nova Tarefa
            </button>
          )}
        </div>
      </div>

      {/* Filters + Delete Sprint */}
      <div className="zeus-card rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={effectiveSprintId}
            onChange={(e) => {
              setSelectedSprintId(e.target.value);
              setConfirmDeleteSprint(false);
            }}
            className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
          >
            {state.sprints.length === 0 ? (
              <option value="">Nenhuma sprint</option>
            ) : (
              state.sprints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} {sp.isActive ? "(Ativa)" : ""}
                </option>
              ))
            )}
          </select>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
          >
            <option value="all">Todas as áreas (11)</option>
            {ZEUS_AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {(["all", "red", "yellow", "green"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`h-8 rounded-md border px-2.5 text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                    : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                }`}
              >
                {st === "all" ? "Todos" : TASK_STATUS_META[st].label}
              </button>
            ))}
          </div>
        </div>

        {canManageSprints && effectiveSprintId && (
          <div className="flex items-center gap-1.5">
            {!confirmDeleteSprint ? (
              <button
                onClick={() => setConfirmDeleteSprint(true)}
                className="inline-flex items-center gap-1 h-8 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Apagar Sprint
              </button>
            ) : (
              <>
                <button
                  onClick={handleDeleteSprint}
                  className="h-8 rounded-md bg-rose-500 px-2.5 text-xs font-semibold text-white hover:bg-rose-400"
                >
                  Confirmar exclusão?
                </button>
                <button
                  onClick={() => setConfirmDeleteSprint(false)}
                  className="h-8 rounded-md border border-[var(--hairline)] px-2.5 text-xs"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showSprintForm && canManageSprints && (
        <form onSubmit={handleCreateSprint} className="zeus-card rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold">Criar nova sprint quinzenal</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              placeholder="Nome (ex.: Sprint 03 — Definição da Configuração)"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="date"
              value={sprintStart}
              onChange={(e) => setSprintStart(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="date"
              value={sprintEnd}
              onChange={(e) => setSprintEnd(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSprintForm(false)}
              className="rounded-md border border-[var(--hairline)] px-3 py-1 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950"
            >
              Criar Sprint
            </button>
          </div>
        </form>
      )}

      {showTaskForm && canCreateAnyTask && (
        <form onSubmit={handleCreateTask} className="zeus-card rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold">Delegar nova tarefa</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              placeholder="Título da atividade..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="url"
              placeholder="Link externo opcional (Drive, CAD, Docs...)"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              {ZEUS_AREAS.filter((a) => canManageArea(currentUser, a.id)).map((a) => (
                <option key={a.id} value={a.id}>
                  Área: {a.name}
                </option>
              ))}
            </select>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              {approvedMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  Responsável: {m.fullName}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label} — {PRIORITY_META[p].eisenhower} ({PRIORITY_META[p].points} pts)
                </option>
              ))}
            </select>
          </div>
          <textarea
            rows={2}
            placeholder="Critério de pronto / detalhes técnicos..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
          <div>
            <div className="text-[11px] text-[var(--ink-subtle)] mb-1.5">
              Áreas impactadas / dependências (para o Grafo estilo Obsidian da V2):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ZEUS_AREAS.filter((a) => a.id !== areaId).map((a) => {
                const selected = impactedAreaIds.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleImpacted(a.id)}
                    className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                      selected
                        ? "border-amber-500 bg-amber-500/15 text-amber-400"
                        : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                    }`}
                  >
                    {a.shortCode}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowTaskForm(false)}
              className="rounded-md border border-[var(--hairline)] px-3 py-1 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950"
            >
              Adicionar Tarefa
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="zeus-card rounded-xl p-8 text-center text-sm text-[var(--ink-subtle)]">
            Nenhuma tarefa encontrada para os filtros selecionados.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const assignee = state.members.find((m) => m.id === task.assigneeId);
            const canEditStatus = canUpdateTaskStatus(currentUser, task);
            const canValidate = canManageArea(currentUser, task.areaId);
            const canApprove = canApproveInMeeting(currentUser);

            return (
              <div key={task.id} className="zeus-card rounded-xl p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-amber-400">
                        {getAreaName(task.areaId)}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      {task.externalUrl && (
                        <a
                          href={task.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                        >
                          Anexo <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <h3 className="text-sm font-medium">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-[var(--ink-subtle)]">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {assignee ? (
                        <button
                          type="button"
                          onClick={() => onOpenProfile(assignee.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-amber-400"
                        >
                          <MemberAvatar member={assignee} size="sm" />
                          <strong>{assignee.fullName}</strong>
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--ink-muted)]">Responsável: —</span>
                      )}
                      {assignee && <RoleBadge role={assignee.role} />}
                      {task.impactedAreaIds.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-subtle)]">
                          Impacta:
                          {task.impactedAreaIds.map((id) => (
                            <AreaChip key={id} areaId={id} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status + 2-Stage Validation + Delete Task */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] p-0.5">
                        {(["red", "yellow", "green"] as TaskStatus[]).map((st) => {
                          const active = task.status === st;
                          const meta = TASK_STATUS_META[st];
                          return (
                            <button
                              key={st}
                              disabled={!canEditStatus}
                              onClick={() => updateTaskStatus(task.id, st)}
                              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                                active
                                  ? "bg-[var(--surface-1)] text-[var(--ink)] shadow-xs"
                                  : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                              }`}
                            >
                              <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>

                      {canValidate && (
                        <button
                          onClick={() => deleteTask(task.id)}
                          title="Apagar tarefa"
                          className="h-7 w-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-rose-400 hover:border-rose-500/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        disabled={!canValidate}
                        onClick={() => toggleDirectorValidation(task.id)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                          task.directorValidated
                            ? "border-blue-500/40 bg-blue-500/15 text-sky-300"
                            : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                        {task.directorValidated ? "Diretor validou" : "Validar (Diretor)"}
                      </button>

                      <button
                        disabled={!canApprove}
                        onClick={() => toggleMeetingApproval(task.id)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                          task.meetingApproved
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                            : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                        }`}
                      >
                        <CheckCheck className="h-3 w-3" />
                        {task.meetingApproved ? "Aprovado na Reunião" : "Aprovar (Reunião)"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
