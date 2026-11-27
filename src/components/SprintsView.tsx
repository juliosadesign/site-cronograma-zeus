"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertOctagon,
  Calendar,
  CalendarRange,
  Check,
  CheckCheck,
  Edit3,
  ExternalLink,
  Filter,
  Ghost,
  Layers,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  canApproveInMeeting,
  canManageArea,
  canUpdateTaskStatus,
  doesDateRangeOverlap,
  formatIsoToBr,
  getAreaCardStyle,
  getAreaMeta,
  isTopLeadership,
  parseFlexibleDateInput,
  PRIORITY_META,
  TASK_STATUS_META,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { Priority, SprintTask, TaskStatus } from "@/lib/types";
import { AreaChip, PriorityBadge, RoleBadge } from "./Badge";
import { MemberAvatar } from "./MemberAvatar";

const DEFAULT_MY_AREA_KEY = "zeus_sprints_default_my_area";
const DEFAULT_MY_AREA_EVENT = "zeus-sprints-default-area-change";
const INITIAL_VISIBLE_TASKS = 40;

function subscribeDefaultMyArea(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(DEFAULT_MY_AREA_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DEFAULT_MY_AREA_EVENT, callback);
  };
}

function getDefaultMyAreaSnapshot(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(DEFAULT_MY_AREA_KEY) === "true";
  } catch {
    return false;
  }
}

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

  const seasonSprints = useMemo(
    () => state.sprints.filter((sp) => sp.seasonYear === state.activeSeason),
    [state.sprints, state.activeSeason]
  );
  const sprintById = useMemo(
    () => new Map(seasonSprints.map((sp) => [sp.id, sp])),
    [seasonSprints]
  );
  const activeSprint = seasonSprints.find((s) => s.isActive) ?? seasonSprints[0];

  // Filters: default to showing everything ("all"), unless user enabled "Deixar só minha área como padrão"
  const [selectedSprintId, setSelectedSprintId] = useState<string>("all");
  const defaultMyArea = useSyncExternalStore(
    subscribeDefaultMyArea,
    getDefaultMyAreaSnapshot,
    () => false
  );
  const [areaFilterOverride, setAreaFilterOverride] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFromRaw, setDateFromRaw] = useState<string>("");
  const [dateToRaw, setDateToRaw] = useState<string>("");
  const [singleDayMode, setSingleDayMode] = useState<"exact" | "from">("exact");
  const [visibleLimit, setVisibleLimit] = useState<number>(INITIAL_VISIBLE_TASKS);

  const [confirmDeleteSprint, setConfirmDeleteSprint] = useState(false);

  // Pop-up modal states
  const [sprintModalMode, setSprintModalMode] = useState<"create" | "edit" | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit" | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Create / Edit Sprint form state
  const [sprintName, setSprintName] = useState("");
  const [sprintStart, setSprintStart] = useState(`${state.activeSeason}-01-01`);
  const [sprintEnd, setSprintEnd] = useState(`${state.activeSeason}-01-14`);

  // Create / Edit Task modal form state
  const [taskSprintId, setTaskSprintId] = useState<string>(activeSprint?.id ?? "");
  const [taskAreaId, setTaskAreaId] = useState<string>(currentUser.areaIds[0] ?? "aerodinamica");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("high");
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>("");
  const [taskUrl, setTaskUrl] = useState("");
  const [taskImpactedAreas, setTaskImpactedAreas] = useState<string[]>([]);
  const [taskBlockedBy, setTaskBlockedBy] = useState("");
  const [taskBlockedReason, setTaskBlockedReason] = useState("");

  // Inline comment & return reason UI
  const [openCommentsTaskId, setOpenCommentsTaskId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [returnReasonTaskId, setReturnReasonTaskId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const hasUserAreas = currentUser.areaIds.length > 0;
  const userMyAreaFilterValue =
    currentUser.areaIds.length === 1 ? currentUser.areaIds[0] : "__mine__";
  const areaFilter =
    areaFilterOverride ?? (defaultMyArea && hasUserAreas ? userMyAreaFilterValue : "all");

  // Close open modals on Escape
  useEffect(() => {
    if (!sprintModalMode && !taskModalMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSprintModalMode(null);
        setTaskModalMode(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sprintModalMode, taskModalMode]);

  const effectiveSprintId =
    selectedSprintId === "all"
      ? "all"
      : seasonSprints.some((sp) => sp.id === selectedSprintId)
      ? selectedSprintId
      : "all";
  const selectedSprintObj =
    effectiveSprintId !== "all" ? sprintById.get(effectiveSprintId) : undefined;

  const approvedMembers = useMemo(
    () => state.members.filter((m) => m.accountStatus === "approved"),
    [state.members]
  );
  const realMembers = useMemo(
    () => approvedMembers.filter((m) => !m.isGhost),
    [approvedMembers]
  );
  const ghostMembers = useMemo(
    () => approvedMembers.filter((m) => m.isGhost),
    [approvedMembers]
  );

  const canManageSprints = canApproveInMeeting(currentUser);
  const manageableAreas = useMemo(
    () => ZEUS_AREAS.filter((a) => canManageArea(currentUser, a.id)),
    [currentUser]
  );
  const canCreateAnyTask = manageableAreas.length > 0;

  // Typed flexible date parsing
  const parsedFrom = useMemo(
    () => parseFlexibleDateInput(dateFromRaw, state.activeSeason),
    [dateFromRaw, state.activeSeason]
  );
  const parsedTo = useMemo(
    () => parseFlexibleDateInput(dateToRaw, state.activeSeason),
    [dateToRaw, state.activeSeason]
  );

  const isSingleDayOnlyFrom = Boolean(
    parsedFrom && !parsedTo && !dateToRaw.trim() && parsedFrom.startIso === parsedFrom.endIso
  );

  const dateFilterBounds = useMemo(() => {
    if (!parsedFrom && !parsedTo) return null;
    if (parsedFrom && parsedTo) {
      const startIso =
        parsedFrom.startIso <= parsedTo.endIso ? parsedFrom.startIso : parsedTo.startIso;
      const endIso =
        parsedFrom.startIso <= parsedTo.endIso ? parsedTo.endIso : parsedFrom.endIso;
      return { startIso, endIso };
    }
    if (parsedFrom) {
      if (parsedFrom.startIso === parsedFrom.endIso && singleDayMode === "from") {
        return { startIso: parsedFrom.startIso, endIso: "" };
      }
      return { startIso: parsedFrom.startIso, endIso: parsedFrom.endIso };
    }
    if (parsedTo) {
      return { startIso: "", endIso: parsedTo.endIso };
    }
    return null;
  }, [parsedFrom, parsedTo, singleDayMode]);

  const memberById = useMemo(
    () => new Map(state.members.map((m) => [m.id, m])),
    [state.members]
  );

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.tasks.filter((t) => {
      const taskSprint = sprintById.get(t.sprintId);
      // Scope to active season sprints (so changing season 2026/2027 works properly)
      if (!taskSprint) return false;

      if (effectiveSprintId !== "all" && t.sprintId !== effectiveSprintId) return false;

      if (areaFilter === "__mine__") {
        if (!currentUser.areaIds.includes(t.areaId)) return false;
      } else if (areaFilter !== "all" && t.areaId !== areaFilter) {
        return false;
      }

      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      if (dateFilterBounds) {
        const itemStart = taskSprint.startDate || t.createdAt;
        const itemEnd = taskSprint.endDate || t.createdAt;
        if (
          !doesDateRangeOverlap(
            itemStart,
            itemEnd,
            dateFilterBounds.startIso,
            dateFilterBounds.endIso
          )
        ) {
          return false;
        }
      }

      if (q) {
        const ids = t.coAssigneeIds?.length ? t.coAssigneeIds : [t.assigneeId];
        const assigneeNames = ids
          .map((id) => memberById.get(id)?.fullName ?? "")
          .join(" ")
          .toLowerCase();
        const haystack = `${t.title} ${t.description} ${assigneeNames} ${taskSprint.name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    state.tasks,
    sprintById,
    effectiveSprintId,
    areaFilter,
    currentUser.areaIds,
    statusFilter,
    dateFilterBounds,
    searchQuery,
    memberById,
  ]);

  const visibleTasks = filteredTasks.slice(0, visibleLimit);

  const hasActiveFilters =
    effectiveSprintId !== "all" ||
    areaFilter !== "all" ||
    statusFilter !== "all" ||
    dateFromRaw.trim() !== "" ||
    dateToRaw.trim() !== "" ||
    searchQuery.trim() !== "";

  const toggleDefaultMyArea = () => {
    const next = !defaultMyArea;
    try {
      localStorage.setItem(DEFAULT_MY_AREA_KEY, next ? "true" : "false");
    } catch {
      // ignore storage errors
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(DEFAULT_MY_AREA_EVENT));
    }
    setAreaFilterOverride(null);
    setVisibleLimit(INITIAL_VISIBLE_TASKS);
  };

  const resetAllFilters = () => {
    setSelectedSprintId("all");
    setAreaFilterOverride("all");
    setStatusFilter("all");
    setDateFromRaw("");
    setDateToRaw("");
    setSearchQuery("");
    setVisibleLimit(INITIAL_VISIBLE_TASKS);
  };

  const openCreateSprintModal = () => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const defaultStart =
      todayIso.startsWith(String(state.activeSeason)) ? todayIso : `${state.activeSeason}-01-01`;
    const defaultEnd =
      twoWeeksLater.startsWith(String(state.activeSeason))
        ? twoWeeksLater
        : `${state.activeSeason}-01-14`;
    setSprintName("");
    setSprintStart(defaultStart);
    setSprintEnd(defaultEnd);
    setSprintModalMode("create");
  };

  const openEditSprintModal = () => {
    if (!selectedSprintObj) return;
    setSprintName(selectedSprintObj.name);
    setSprintStart(selectedSprintObj.startDate);
    setSprintEnd(selectedSprintObj.endDate);
    setSprintModalMode("edit");
  };

  const openCreateTaskModal = (targetSprintId?: string) => {
    const resolvedSprint =
      targetSprintId ||
      (effectiveSprintId !== "all" ? effectiveSprintId : activeSprint?.id ?? seasonSprints[0]?.id ?? "");
    const preferredArea =
      areaFilter !== "all" && areaFilter !== "__mine__" && canManageArea(currentUser, areaFilter)
        ? areaFilter
        : manageableAreas[0]?.id ?? currentUser.areaIds[0] ?? "aerodinamica";
    setEditingTaskId(null);
    setTaskSprintId(resolvedSprint);
    setTaskAreaId(preferredArea);
    setTaskTitle("");
    setTaskDesc("");
    setTaskPriority("high");
    setTaskAssigneeId(currentUser.accountStatus === "approved" ? currentUser.id : "");
    setTaskUrl("");
    setTaskImpactedAreas([]);
    setTaskBlockedBy("");
    setTaskBlockedReason("");
    setTaskModalMode("create");
  };

  const openEditTaskModal = (task: SprintTask) => {
    setEditingTaskId(task.id);
    setTaskSprintId(task.sprintId);
    setTaskAreaId(task.areaId);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    setTaskPriority(task.priority);
    setTaskAssigneeId(task.assigneeId);
    setTaskUrl(task.externalUrl ?? "");
    setTaskImpactedAreas(task.impactedAreaIds ?? []);
    setTaskBlockedBy(task.blockedByAreaId ?? "");
    setTaskBlockedReason(task.blockedReason ?? "");
    setTaskModalMode("edit");
  };

  const toggleImpactedArea = (id: string) => {
    setTaskImpactedAreas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submitSprintModal = (andAddTasks: boolean) => {
    if (!sprintName.trim()) return;
    if (sprintModalMode === "edit" && selectedSprintObj) {
      updateSprint(selectedSprintObj.id, {
        name: sprintName.trim(),
        startDate: sprintStart,
        endDate: sprintEnd,
      });
      setSprintModalMode(null);
      return;
    }

    const newId = createSprint({
      name: sprintName.trim(),
      startDate: sprintStart,
      endDate: sprintEnd,
    });
    setSprintModalMode(null);
    if (newId) {
      setSelectedSprintId(newId);
      if (andAddTasks && canCreateAnyTask) {
        openCreateTaskModal(newId);
      }
    }
  };

  const submitTaskModal = (keepAdding: boolean) => {
    if (!taskTitle.trim()) return;

    if (taskModalMode === "edit" && editingTaskId) {
      updateTask(editingTaskId, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        assigneeId: taskAssigneeId,
        externalUrl: taskUrl.trim() || undefined,
        impactedAreaIds: taskImpactedAreas.filter((id) => id !== taskAreaId),
        blockedByAreaId: taskBlockedBy || undefined,
        blockedReason: taskBlockedReason.trim(),
      });
      setTaskModalMode(null);
      setEditingTaskId(null);
      return;
    }

    const sprintTarget = taskSprintId || activeSprint?.id || seasonSprints[0]?.id;
    if (!sprintTarget) return;

    createTask({
      sprintId: sprintTarget,
      areaId: taskAreaId,
      assigneeId: taskAssigneeId,
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      priority: taskPriority,
      externalUrl: taskUrl.trim() || undefined,
      impactedAreaIds: taskImpactedAreas.filter((id) => id !== taskAreaId),
      blockedByAreaId: taskBlockedBy || undefined,
      blockedReason: taskBlockedReason.trim() || undefined,
    });

    if (keepAdding) {
      setTaskTitle("");
      setTaskDesc("");
      setTaskUrl("");
      setTaskImpactedAreas([]);
      setTaskBlockedBy("");
      setTaskBlockedReason("");
    } else {
      setTaskModalMode(null);
    }
  };

  const handleNativeDatePick = (which: "from" | "to", iso: string) => {
    if (!iso) return;
    const br = formatIsoToBr(iso);
    if (which === "from") setDateFromRaw(br);
    else setDateToRaw(br);
    setVisibleLimit(INITIAL_VISIBLE_TASKS);
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
              type="button"
              onClick={openCreateSprintModal}
              className="zeus-btn inline-flex items-center gap-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium hover:border-blue-500/50"
            >
              <Plus className="h-3.5 w-3.5" /> Nova Sprint
            </button>
          )}
          {canCreateAnyTask && seasonSprints.length > 0 && (
            <button
              type="button"
              onClick={() => openCreateTaskModal()}
              className="zeus-btn inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Nova Tarefa
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <div data-tour="sprints-controls" className="zeus-card rounded-xl p-3.5 space-y-3">
        {/* Row 1: Sprint, Area, Status, Sprint Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrar por sprint"
              value={effectiveSprintId}
              onChange={(e) => {
                setSelectedSprintId(e.target.value);
                setConfirmDeleteSprint(false);
                setVisibleLimit(INITIAL_VISIBLE_TASKS);
              }}
              className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
            >
              <option value="all">
                Todas as sprints ({seasonSprints.length} · Mostrar tudo)
              </option>
              {seasonSprints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({formatIsoToBr(sp.startDate)} → {formatIsoToBr(sp.endDate)})
                  {sp.isActive ? " · Ativa" : ""}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por área"
              value={areaFilter}
              onChange={(e) => {
                setAreaFilterOverride(e.target.value);
                setVisibleLimit(INITIAL_VISIBLE_TASKS);
              }}
              className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
            >
              <option value="all">Todas as áreas ({ZEUS_AREAS.length})</option>
              {currentUser.areaIds.length > 1 && (
                <option value="__mine__">
                  Minhas áreas ({currentUser.areaIds.length})
                </option>
              )}
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
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setVisibleLimit(INITIAL_VISIBLE_TASKS);
                  }}
                  className={`h-8 rounded-md border px-2.5 text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                      : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                  }`}
                >
                  {st === "all" ? "Todos" : TASK_STATUS_META[st].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {canManageSprints && selectedSprintObj && (
              <>
                <button
                  type="button"
                  onClick={openEditSprintModal}
                  className="inline-flex items-center gap-1 h-8 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-2.5 text-xs hover:text-sky-400"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Editar Sprint
                </button>

                {!confirmDeleteSprint ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteSprint(true)}
                    className="inline-flex items-center gap-1 h-8 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Apagar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        deleteSprint(selectedSprintObj.id);
                        setConfirmDeleteSprint(false);
                        setSelectedSprintId("all");
                      }}
                      className="h-8 rounded-md bg-rose-500 px-2.5 text-xs font-semibold text-white hover:bg-rose-400"
                    >
                      Confirmar?
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteSprint(false)}
                      className="h-8 rounded-md border border-[var(--hairline)] px-2.5 text-xs"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Row 2: Typed Date Filter + Search + "Só minha área" + Persistent default */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--hairline)]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Flexible Typed Dates */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-subtle)]">
                <CalendarRange className="h-3.5 w-3.5 text-blue-400" />
                Datas:
              </span>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={dateFromRaw}
                  onChange={(e) => {
                    setDateFromRaw(e.target.value);
                    setVisibleLimit(INITIAL_VISIBLE_TASKS);
                  }}
                  placeholder="De: 15/03/2026 ou março"
                  aria-label="Filtrar por data inicial digitando"
                  className="h-8 w-44 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] pl-2.5 pr-7 text-xs placeholder:text-[var(--ink-subtle)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="date"
                  aria-label="Escolher data inicial no calendário"
                  onChange={(e) => handleNativeDatePick("from", e.target.value)}
                  title="Escolher data no calendário"
                  className="absolute right-1 h-6 w-5 opacity-60 hover:opacity-100 cursor-pointer bg-transparent text-xs"
                />
              </div>

              <span className="text-[11px] text-[var(--ink-subtle)]">até</span>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={dateToRaw}
                  onChange={(e) => {
                    setDateToRaw(e.target.value);
                    setVisibleLimit(INITIAL_VISIBLE_TASKS);
                  }}
                  placeholder="Até: 30/04/2026"
                  aria-label="Filtrar por data final digitando"
                  className="h-8 w-36 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] pl-2.5 pr-7 text-xs placeholder:text-[var(--ink-subtle)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="date"
                  aria-label="Escolher data final no calendário"
                  onChange={(e) => handleNativeDatePick("to", e.target.value)}
                  title="Escolher data no calendário"
                  className="absolute right-1 h-6 w-5 opacity-60 hover:opacity-100 cursor-pointer bg-transparent text-xs"
                />
              </div>

              {isSingleDayOnlyFrom && (
                <button
                  type="button"
                  onClick={() =>
                    setSingleDayMode((m) => (m === "exact" ? "from" : "exact"))
                  }
                  className="h-7 rounded-md border border-blue-500/40 bg-blue-500/10 px-2 text-[10px] font-medium text-sky-300"
                  title="Alternar entre data exata ou a partir desta data"
                >
                  {singleDayMode === "exact"
                    ? `No dia ${parsedFrom?.label}`
                    : `A partir de ${parsedFrom?.label}`}
                </button>
              )}

              {(dateFromRaw.trim() && !parsedFrom) || (dateToRaw.trim() && !parsedTo) ? (
                <span className="text-[11px] text-amber-400">
                  Ex.: 15/03/2026, 03/2026 ou março
                </span>
              ) : dateFilterBounds ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                  <Calendar className="h-3 w-3" />
                  {parsedFrom && !parsedTo && dateFilterBounds.endIso
                    ? parsedFrom.label
                    : `${formatIsoToBr(dateFilterBounds.startIso) || "Início"} → ${
                        formatIsoToBr(dateFilterBounds.endIso) || "Hoje+"
                      }`}
                </span>
              ) : null}
            </div>

            {/* Quick text search */}
            <div className="relative flex items-center">
              <Search className="h-3.5 w-3.5 text-[var(--ink-subtle)] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleLimit(INITIAL_VISIBLE_TASKS);
                }}
                placeholder="Buscar tarefa, responsável..."
                aria-label="Buscar tarefa ou responsável"
                className="h-8 w-44 sm:w-52 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] pl-8 pr-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasUserAreas && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const isMine =
                      areaFilter === "__mine__" ||
                      (currentUser.areaIds.length === 1 && areaFilter === currentUser.areaIds[0]);
                    setAreaFilterOverride(isMine ? "all" : userMyAreaFilterValue);
                    setVisibleLimit(INITIAL_VISIBLE_TASKS);
                  }}
                  className={`h-8 rounded-md border px-2.5 text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                    areaFilter === "__mine__" ||
                    (currentUser.areaIds.length === 1 && areaFilter === currentUser.areaIds[0])
                      ? "border-blue-500/60 bg-blue-600/20 text-sky-300"
                      : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Filter className="h-3 w-3" />
                  {currentUser.areaIds.length === 1 ? "Só minha área" : "Só minhas áreas"}
                </button>

                <label className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)]/70 px-2.5 h-8 text-[11px] text-[var(--ink-muted)] cursor-pointer select-none hover:border-[var(--hairline-strong)]">
                  <input
                    type="checkbox"
                    checked={defaultMyArea}
                    onChange={toggleDefaultMyArea}
                    className="rounded border-[var(--hairline-strong)] accent-blue-600"
                  />
                  <span>Deixar só minha área como padrão</span>
                </label>
              </>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] inline-flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Mostrar tudo
              </button>
            )}
          </div>
        </div>

        {/* Summary Counter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--ink-subtle)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold text-[var(--ink-muted)]">
              Exibindo {filteredTasks.length} {filteredTasks.length === 1 ? "tarefa" : "tarefas"}
            </span>
            {selectedSprintObj && (
              <span>
                · {selectedSprintObj.name} ({formatIsoToBr(selectedSprintObj.startDate)} →{" "}
                {formatIsoToBr(selectedSprintObj.endDate)})
              </span>
            )}
          </div>
          {canCreateAnyTask && selectedSprintObj && (
            <button
              type="button"
              onClick={() => openCreateTaskModal(selectedSprintObj.id)}
              className="inline-flex items-center gap-1 text-sky-400 hover:underline font-medium"
            >
              <Plus className="h-3 w-3" /> Adicionar tarefa em {selectedSprintObj.name}
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="zeus-card rounded-xl p-8 text-center space-y-3">
            <div className="text-sm text-[var(--ink-muted)]">
              {selectedSprintObj
                ? `Nenhuma tarefa encontrada em "${selectedSprintObj.name}" com os filtros atuais.`
                : "Nenhuma tarefa encontrada para os filtros selecionados."}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium hover:border-blue-500/50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Mostrar todas as tarefas
                </button>
              )}
              {canCreateAnyTask && seasonSprints.length > 0 && (
                <button
                  type="button"
                  onClick={() => openCreateTaskModal(selectedSprintObj?.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />{" "}
                  {selectedSprintObj
                    ? `Adicionar primeira tarefa em ${selectedSprintObj.name}`
                    : "Adicionar Nova Tarefa"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {visibleTasks.map((task) => {
              const assignee = memberById.get(task.assigneeId);
              const taskSprint = sprintById.get(task.sprintId);
              const canEditStatus = canUpdateTaskStatus(currentUser, task);
              const canValidate = canManageArea(currentUser, task.areaId);
              const canApprove = canApproveInMeeting(currentUser);
              const comments = state.taskComments.filter((c) => c.taskId === task.id);
              const isCommentsOpen = openCommentsTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="zeus-card rounded-xl p-4 space-y-3 border-[1.5px]"
                  style={getAreaCardStyle(task.areaId, { emphasis: "medium" })}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <AreaChip areaId={task.areaId} showName />
                        <PriorityBadge priority={task.priority} />
                        {taskSprint && effectiveSprintId === "all" && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)]/80 px-2 py-0.5 font-mono text-[10px] text-[var(--ink-muted)]">
                            <Layers className="h-3 w-3 text-blue-400" />
                            {taskSprint.name} · {formatIsoToBr(taskSprint.startDate)} →{" "}
                            {formatIsoToBr(taskSprint.endDate)}
                          </span>
                        )}
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
                        {task.coAssigneeIds && task.coAssigneeIds.length > 1 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {task.coAssigneeIds
                              .map((id) => memberById.get(id))
                              .filter((m): m is NonNullable<typeof m> => Boolean(m))
                              .map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => onOpenProfile(m.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)]/70 px-1.5 py-0.5 text-[11px] text-[var(--ink-muted)] hover:text-amber-400"
                                >
                                  <MemberAvatar member={m} size="sm" />
                                  <span className="font-medium">{m.fullName.split(" ")[0]}</span>
                                  {m.isGhost && (
                                    <Ghost className="h-2.5 w-2.5 text-violet-400" />
                                  )}
                                </button>
                              ))}
                          </div>
                        ) : assignee ? (
                          <button
                            type="button"
                            onClick={() => onOpenProfile(assignee.id)}
                            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-amber-400"
                          >
                            <MemberAvatar member={assignee} size="sm" />
                            <strong>{assignee.fullName}</strong>
                            {assignee.isGhost && (
                              <span className="inline-flex items-center gap-0.5 rounded-full border border-violet-500/40 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-medium text-violet-300">
                                <Ghost className="h-2.5 w-2.5" /> Fantasma
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--ink-muted)]">Responsável: —</span>
                        )}
                        {assignee &&
                          (!task.coAssigneeIds || task.coAssigneeIds.length <= 1) &&
                          (!assignee.isGhost || assignee.roleConfirmed) && (
                            <RoleBadge role={assignee.role} />
                          )}
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
                                type="button"
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
                              onClick={() => openEditTaskModal(task)}
                              title="Editar tarefa no pop-up"
                              className="h-7 w-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-sky-400"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
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
                          type="button"
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
                          type="button"
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

                        {(canValidate || canApprove) &&
                          (task.status === "green" || task.directorValidated) && (
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
                            const author = memberById.get(c.authorId);
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
            })}

            {filteredTasks.length > visibleLimit && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((n) => n + INITIAL_VISIBLE_TASKS)}
                  className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-4 py-2 text-xs font-medium hover:border-blue-500/50"
                >
                  Carregar mais tarefas ({filteredTasks.length - visibleLimit} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* POP-UP MODAL: Nova Sprint / Editar Sprint */}
      {sprintModalMode && canManageSprints && (
        <div
          onClick={() => setSprintModalMode(null)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={sprintModalMode === "edit" ? "Editar Sprint" : "Nova Sprint"}
            className="w-full max-w-lg zeus-card rounded-2xl border border-[var(--hairline-strong)] bg-[var(--surface-1)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--hairline)]">
              <div>
                <h2 className="text-base font-semibold">
                  {sprintModalMode === "edit"
                    ? "Editar Sprint"
                    : `Nova Sprint (ZEUS ${state.activeSeason})`}
                </h2>
                <p className="text-[11px] text-[var(--ink-subtle)]">
                  {sprintModalMode === "edit"
                    ? "Atualize o nome e a janela de datas desta sprint."
                    : "Crie a sprint e, se quiser, já abra o pop-up para cadastrar suas tarefas."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSprintModalMode(null)}
                aria-label="Fechar modal de sprint"
                className="h-8 w-8 rounded-md border border-[var(--hairline)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSprintModal(false);
              }}
              className="p-5 space-y-4"
            >
              <label className="block space-y-1 text-xs">
                <span className="font-medium text-[var(--ink-muted)]">Nome da Sprint</span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex.: Sprint 13 · Ensaios de Voo"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                  className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1 text-xs">
                  <span className="font-medium text-[var(--ink-muted)]">Data de Início</span>
                  <input
                    type="date"
                    required
                    value={sprintStart}
                    onChange={(e) => setSprintStart(e.target.value)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs"
                  />
                </label>
                <label className="block space-y-1 text-xs">
                  <span className="font-medium text-[var(--ink-muted)]">Data de Encerramento</span>
                  <input
                    type="date"
                    required
                    value={sprintEnd}
                    onChange={(e) => setSprintEnd(e.target.value)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setSprintModalMode(null)}
                  className="rounded-md border border-[var(--hairline)] px-3 py-1.5 text-xs hover:border-[var(--hairline-strong)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md border border-blue-500/40 bg-blue-600/15 hover:bg-blue-600/25 px-3.5 py-1.5 text-xs font-semibold text-sky-300"
                >
                  <Save className="h-3.5 w-3.5" />
                  {sprintModalMode === "edit" ? "Salvar Sprint" : "Criar Sprint"}
                </button>
                {sprintModalMode === "create" && canCreateAnyTask && (
                  <button
                    type="button"
                    onClick={() => submitSprintModal(true)}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white"
                  >
                    Criar e adicionar tarefas →
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: Nova Tarefa / Editar Tarefa */}
      {taskModalMode && (
        <div
          onClick={() => setTaskModalMode(null)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={taskModalMode === "edit" ? "Editar Tarefa" : "Nova Tarefa da Sprint"}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto zeus-card rounded-2xl border border-[var(--hairline-strong)] bg-[var(--surface-1)] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[var(--hairline)] bg-[var(--surface-1)]">
              <div>
                <h2 className="text-base font-semibold">
                  {taskModalMode === "edit" ? "Editar Tarefa da Sprint" : "Nova Tarefa da Sprint"}
                </h2>
                <p className="text-[11px] text-[var(--ink-subtle)]">
                  {taskModalMode === "edit"
                    ? "Atualize responsável, prioridade, bloqueios ou descrição da entrega."
                    : "Escolha a sprint, área e responsável — salve uma ou cadastre várias em sequência."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTaskModalMode(null)}
                aria-label="Fechar modal de tarefa"
                className="h-8 w-8 rounded-md border border-[var(--hairline)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitTaskModal(false);
              }}
              className="p-5 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1 text-xs sm:col-span-2">
                  <span className="font-medium text-[var(--ink-muted)]">Título da tarefa *</span>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ex.: Definir perfil aerodinâmico da asa e enviar ao CAD"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>

                {taskModalMode === "create" && (
                  <>
                    <label className="block space-y-1 text-xs">
                      <span className="font-medium text-[var(--ink-muted)]">Sprint</span>
                      <select
                        value={taskSprintId}
                        onChange={(e) => setTaskSprintId(e.target.value)}
                        className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-2 text-xs"
                      >
                        {seasonSprints.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} ({formatIsoToBr(sp.startDate)} → {formatIsoToBr(sp.endDate)})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-1 text-xs">
                      <span className="font-medium text-[var(--ink-muted)]">Área responsável</span>
                      <select
                        value={taskAreaId}
                        onChange={(e) => setTaskAreaId(e.target.value)}
                        className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-2 text-xs"
                      >
                        {manageableAreas.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.shortCode} · {a.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                <label className="block space-y-1 text-xs">
                  <span className="font-medium text-[var(--ink-muted)]">Responsável</span>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-2 text-xs"
                  >
                    <option value="">Sem responsável definido</option>
                    {realMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                    {ghostMembers.length > 0 && (
                      <optgroup label="Membros Fantasmas (apresentação local)">
                        {ghostMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName} (Fantasma)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </label>

                <label className="block space-y-1 text-xs">
                  <span className="font-medium text-[var(--ink-muted)]">Prioridade</span>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-2 text-xs"
                  >
                    {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_META[p].label} · {PRIORITY_META[p].eisenhower}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1 text-xs sm:col-span-2">
                  <span className="font-medium text-[var(--ink-muted)]">
                    Link externo (Drive, Figma, Teams, etc.)
                  </span>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={taskUrl}
                    onChange={(e) => setTaskUrl(e.target.value)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs"
                  />
                </label>

                <label className="block space-y-1 text-xs sm:col-span-2">
                  <span className="font-medium text-[var(--ink-muted)]">Descrição técnica</span>
                  <textarea
                    rows={3}
                    placeholder="Escopo, critérios de entrega ou observações..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-2 text-xs"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-[var(--ink-muted)]">
                  Áreas impactadas / dependentes (opcional):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ZEUS_AREAS.filter((a) => a.id !== taskAreaId).map((a) => {
                    const selected = taskImpactedAreas.includes(a.id);
                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => toggleImpactedArea(a.id)}
                        className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                          selected
                            ? "border-blue-500/70 bg-blue-600/20 text-sky-300"
                            : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                        }`}
                      >
                        {a.shortCode}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-rose-500/25 bg-rose-500/5 p-3">
                <label className="block space-y-1 text-xs">
                  <span className="text-[11px] text-[var(--ink-muted)]">Bloqueada por área</span>
                  <select
                    value={taskBlockedBy}
                    onChange={(e) => setTaskBlockedBy(e.target.value)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                  >
                    <option value="">Sem bloqueio externo</option>
                    {ZEUS_AREAS.filter((a) => a.id !== taskAreaId).map((a) => (
                      <option key={a.id} value={a.id}>
                        Aguardando: {a.shortCode} · {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-xs">
                  <span className="text-[11px] text-[var(--ink-muted)]">Motivo do bloqueio</span>
                  <input
                    type="text"
                    placeholder="O que falta para destravar?"
                    value={taskBlockedReason}
                    onChange={(e) => setTaskBlockedReason(e.target.value)}
                    className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setTaskModalMode(null)}
                  className="rounded-md border border-[var(--hairline)] px-3 py-1.5 text-xs hover:border-[var(--hairline-strong)]"
                >
                  Cancelar
                </button>
                {taskModalMode === "create" && (
                  <button
                    type="button"
                    onClick={() => submitTaskModal(true)}
                    className="rounded-md border border-blue-500/40 bg-blue-600/15 hover:bg-blue-600/25 px-3 py-1.5 text-xs font-semibold text-sky-300"
                  >
                    Salvar e adicionar outra
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-semibold text-white"
                >
                  <Save className="h-3.5 w-3.5" />
                  {taskModalMode === "edit" ? "Salvar alterações" : "Adicionar Tarefa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
