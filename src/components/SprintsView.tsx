"use client";

import { useState } from "react";
import {
  AlertOctagon,
  Check,
  CheckCheck,
  Edit3,
  ExternalLink,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import {
  canApproveInMeeting,
  canManageArea,
  canUpdateTaskStatus,
  getAreaCardStyle,
  getAreaMeta,
  isTopLeadership,
  PRIORITY_META,
  TASK_STATUS_META,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { Priority, SprintTask, TaskStatus } from "@/lib/types";
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
    returnTaskFromMeeting,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    deleteTaskComment,
    createSprint,
    updateSprint,
    deleteSprint,
  } = useZeus();

  const seasonSprints = state.sprints.filter((sp) => sp.seasonYear === state.activeSeason);
  const activeSprint = seasonSprints.find((s) => s.isActive) ?? seasonSprints[0];
  const [selectedSprintId, setSelectedSprintId] = useState(activeSprint?.id ?? "");
  const [confirmDeleteSprint, setConfirmDeleteSprint] = useState(false);

  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState(currentUser.areaIds[0] ?? "aerodinamica");
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [priority, setPriority] = useState<Priority>("high");
  const [externalUrl, setExternalUrl] = useState("");
  const [impactedAreaIds, setImpactedAreaIds] = useState<string[]>([]);
  const [blockedByAreaId, setBlockedByAreaId] = useState("");
  const [blockedReason, setBlockedReason] = useState("");

  const [sprintName, setSprintName] = useState("");
  const [sprintStart, setSprintStart] = useState(`${state.activeSeason}-11-25`);
  const [sprintEnd, setSprintEnd] = useState(`${state.activeSeason}-12-09`);

  const [editSpName, setEditSpName] = useState("");
  const [editSpStart, setEditSpStart] = useState("");
  const [editSpEnd, setEditSpEnd] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>("medium");
  const [editTaskAssignee, setEditTaskAssignee] = useState("");
  const [editTaskUrl, setEditTaskUrl] = useState("");
  const [editTaskBlockedBy, setEditTaskBlockedBy] = useState("");
  const [editTaskBlockedReason, setEditTaskBlockedReason] = useState("");

  const [openCommentsTaskId, setOpenCommentsTaskId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [returnReasonTaskId, setReturnReasonTaskId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const effectiveSprintId = seasonSprints.some((sp) => sp.id === selectedSprintId)
    ? selectedSprintId
    : (activeSprint?.id ?? "");
  const effectiveSprint = seasonSprints.find((sp) => sp.id === effectiveSprintId);

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
      blockedByAreaId: blockedByAreaId || undefined,
      blockedReason: blockedReason.trim() || undefined,
    });
    setTitle("");
    setDescription("");
    setExternalUrl("");
    setImpactedAreaIds([]);
    setBlockedByAreaId("");
    setBlockedReason("");
    setShowTaskForm(false);
  };

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;
    createSprint({ name: sprintName.trim(), startDate: sprintStart, endDate: sprintEnd });
    setSprintName("");
    setShowSprintForm(false);
  };

  const startEditingTask = (task: SprintTask) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description);
    setEditTaskPriority(task.priority);
    setEditTaskAssignee(task.assigneeId);
    setEditTaskUrl(task.externalUrl ?? "");
    setEditTaskBlockedBy(task.blockedByAreaId ?? "");
    setEditTaskBlockedReason(task.blockedReason ?? "");
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
            Fluxo: Membro (Vermelho/Amarelo/Verde) → Diretor valida → Capitão/Dev aprova na reunião. Cores identificam cada área.
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

      {/* Filters + Edit/Delete Sprint */}
      <div className="zeus-card rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={effectiveSprintId}
            onChange={(e) => {
              setSelectedSprintId(e.target.value);
              setConfirmDeleteSprint(false);
              setEditingSprint(false);
            }}
            className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
          >
            {seasonSprints.length === 0 ? (
              <option value="">Nenhuma sprint em {state.activeSeason}</option>
            ) : (
              seasonSprints.map((sp) => (
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
                {a.shortCode} · {a.name}
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

        {canManageSprints && effectiveSprint && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEditSpName(effectiveSprint.name);
                setEditSpStart(effectiveSprint.startDate);
                setEditSpEnd(effectiveSprint.endDate);
                setEditingSprint((v) => !v);
              }}
              className="inline-flex items-center gap-1 h-8 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-2.5 text-xs hover:text-sky-400"
            >
              <Edit3 className="h-3.5 w-3.5" /> Editar Sprint
            </button>

            {!confirmDeleteSprint ? (
              <button
                onClick={() => setConfirmDeleteSprint(true)}
                className="inline-flex items-center gap-1 h-8 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Apagar
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    deleteSprint(effectiveSprint.id);
                    setConfirmDeleteSprint(false);
                  }}
                  className="h-8 rounded-md bg-rose-500 px-2.5 text-xs font-semibold text-white hover:bg-rose-400"
                >
                  Confirmar?
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

      {editingSprint && canManageSprints && effectiveSprint && (
        <div className="zeus-card rounded-xl p-4 space-y-2.5">
          <div className="text-xs font-semibold">Editar Sprint</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={editSpName}
              onChange={(e) => setEditSpName(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="date"
              value={editSpStart}
              onChange={(e) => setEditSpStart(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="date"
              value={editSpEnd}
              onChange={(e) => setEditSpEnd(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingSprint(false)}
              className="rounded-md border border-[var(--hairline)] px-2.5 py-1 text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                updateSprint(effectiveSprint.id, {
                  name: editSpName.trim() || effectiveSprint.name,
                  startDate: editSpStart,
                  endDate: editSpEnd,
                });
                setEditingSprint(false);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
            >
              <Save className="h-3 w-3" /> Salvar
            </button>
          </div>
        </div>
      )}

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
                  Área: {a.shortCode} · {a.name}
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
            <select
              value={blockedByAreaId}
              onChange={(e) => setBlockedByAreaId(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="">Sem bloqueio de outra área</option>
              {ZEUS_AREAS.filter((a) => a.id !== areaId).map((a) => (
                <option key={a.id} value={a.id}>
                  Bloqueado por: {a.shortCode} · {a.name}
                </option>
              ))}
            </select>
          </div>
          {blockedByAreaId && (
            <input
              type="text"
              placeholder="Motivo do bloqueio (ex.: aguardando polar ou orçamento)..."
              value={blockedReason}
              onChange={(e) => setBlockedReason(e.target.value)}
              className="w-full rounded-md border border-rose-500/40 bg-rose-500/5 px-2.5 py-1.5 text-xs"
            />
          )}
          <textarea
            rows={2}
            placeholder="Critério de pronto / detalhes técnicos..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
          <div>
            <div className="text-[11px] text-[var(--ink-subtle)] mb-1.5">
              Áreas impactadas / dependências (aparece no Grafo Obsidian):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ZEUS_AREAS.filter((a) => a.id !== areaId).map((a) => {
                const selected = impactedAreaIds.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleImpacted(a.id)}
                    style={selected ? { borderColor: a.colorHex, color: a.colorHex } : undefined}
                    className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                      selected
                        ? "bg-[var(--surface-2)]"
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
            const comments = state.taskComments.filter((c) => c.taskId === task.id);
            const isCommentsOpen = openCommentsTaskId === task.id;
            const isEditing = editingTaskId === task.id;

            return (
              <div
                key={task.id}
                className="zeus-card rounded-xl p-4 space-y-3 border-[1.5px]"
                style={getAreaCardStyle(task.areaId, { emphasis: "medium" })}
              >
                {isEditing ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editTaskTitle}
                        onChange={(e) => setEditTaskTitle(e.target.value)}
                        className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="url"
                        placeholder="Link externo"
                        value={editTaskUrl}
                        onChange={(e) => setEditTaskUrl(e.target.value)}
                        className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                      />
                      <select
                        value={editTaskAssignee}
                        onChange={(e) => setEditTaskAssignee(e.target.value)}
                        className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                      >
                        {approvedMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            Responsável: {m.fullName}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editTaskPriority}
                        onChange={(e) => setEditTaskPriority(e.target.value as Priority)}
                        className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                      >
                        {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                          <option key={p} value={p}>
                            {PRIORITY_META[p].label} ({PRIORITY_META[p].points} pts)
                          </option>
                        ))}
                      </select>
                      <select
                        value={editTaskBlockedBy}
                        onChange={(e) => setEditTaskBlockedBy(e.target.value)}
                        className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                      >
                        <option value="">Sem bloqueio</option>
                        {ZEUS_AREAS.filter((a) => a.id !== task.areaId).map((a) => (
                          <option key={a.id} value={a.id}>
                            Bloqueado por: {a.shortCode} · {a.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Motivo do bloqueio..."
                        value={editTaskBlockedReason}
                        onChange={(e) => setEditTaskBlockedReason(e.target.value)}
                        className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={editTaskDesc}
                      onChange={(e) => setEditTaskDesc(e.target.value)}
                      className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="rounded-md border border-[var(--hairline)] px-2.5 py-1 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateTask(task.id, {
                            title: editTaskTitle.trim() || task.title,
                            description: editTaskDesc.trim(),
                            priority: editTaskPriority,
                            assigneeId: editTaskAssignee,
                            externalUrl: editTaskUrl.trim() || undefined,
                            blockedByAreaId: editTaskBlockedBy || undefined,
                            blockedReason: editTaskBlockedReason.trim(),
                          });
                          setEditingTaskId(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        <Save className="h-3 w-3" /> Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <AreaChip areaId={task.areaId} showName />
                        <PriorityBadge priority={task.priority} />
                        {task.blockedByAreaId && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/45 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                            <AlertOctagon className="h-3 w-3" />
                            Bloqueado por {getAreaMeta(task.blockedByAreaId).shortCode}
                          </span>
                        )}
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
                      {task.blockedReason && (
                        <div className="rounded-md border border-rose-500/30 bg-rose-500/8 px-2.5 py-1 text-[11px] text-rose-300">
                          <strong>Bloqueio:</strong> {task.blockedReason}
                        </div>
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

                    {/* Status + Validation + Edit/Comments */}
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

                        <button
                          type="button"
                          onClick={() =>
                            setOpenCommentsTaskId(isCommentsOpen ? null : task.id)
                          }
                          title="Comentários e histórico"
                          className={`h-7 px-2 rounded-md border text-[11px] inline-flex items-center gap-1 ${
                            comments.length > 0
                              ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                              : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                          }`}
                        >
                          <MessageSquare className="h-3 w-3" />
                          {comments.length}
                        </button>

                        {canValidate && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditingTask(task)}
                              title="Editar tarefa"
                              className="h-7 w-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-sky-400"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              title="Apagar tarefa"
                              className="h-7 w-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-rose-400 hover:border-rose-500/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
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

                        {(canValidate || canApprove) && (task.status === "green" || task.directorValidated) && (
                          <button
                            type="button"
                            onClick={() => {
                              setReturnReasonTaskId(
                                returnReasonTaskId === task.id ? null : task.id
                              );
                              setReturnReason("");
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-500/20"
                          >
                            <RotateCcw className="h-3 w-3" /> Devolver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {returnReasonTaskId === task.id && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Motivo da devolução (registrado no histórico da tarefa)..."
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="flex-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        returnTaskFromMeeting(task.id, returnReason);
                        setReturnReasonTaskId(null);
                        setOpenCommentsTaskId(task.id);
                      }}
                      className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950"
                    >
                      Confirmar devolução
                    </button>
                  </div>
                )}

                {isCommentsOpen && (
                  <div className="pt-2.5 border-t border-[var(--hairline)] space-y-2.5">
                    <div className="text-[11px] font-semibold text-[var(--ink-subtle)]">
                      Comentários & Histórico ({comments.length})
                    </div>

                    {comments.length > 0 && (
                      <div className="space-y-1.5">
                        {comments.map((c) => {
                          const author = state.members.find((m) => m.id === c.authorId);
                          const canDel =
                            c.authorId === currentUser.id || isTopLeadership(currentUser.role);
                          return (
                            <div
                              key={c.id}
                              className={`rounded-lg border p-2.5 text-xs flex items-start justify-between gap-2 ${
                                c.kind === "rejection"
                                  ? "border-rose-500/35 bg-rose-500/8"
                                  : c.kind === "blocker"
                                  ? "border-amber-500/35 bg-amber-500/8"
                                  : "border-[var(--hairline)] bg-[var(--surface-2)]/60"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <strong>{author?.fullName ?? "Membro"}</strong>
                                  <span className="font-mono text-[10px] text-[var(--ink-subtle)]">
                                    · {c.createdAt}
                                  </span>
                                  {c.kind === "rejection" && (
                                    <span className="rounded bg-rose-500/20 px-1.5 text-[9px] font-semibold text-rose-300">
                                      DEVOLUÇÃO
                                    </span>
                                  )}
                                  {c.kind === "blocker" && (
                                    <span className="rounded bg-amber-500/20 px-1.5 text-[9px] font-semibold text-amber-300">
                                      BLOQUEIO
                                    </span>
                                  )}
                                </div>
                                <div className="text-[var(--ink-muted)]">{c.body}</div>
                              </div>
                              {canDel && (
                                <button
                                  type="button"
                                  onClick={() => deleteTaskComment(c.id)}
                                  className="text-[var(--ink-subtle)] hover:text-rose-400"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!commentText.trim()) return;
                        addTaskComment(task.id, commentText.trim(), "comment");
                        setCommentText("");
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Escrever comentário ou atualização técnica..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <Send className="h-3 w-3" /> Enviar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
