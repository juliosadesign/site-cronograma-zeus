"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Square,
  Trash2,
} from "lucide-react";
import {
  canApproveInMeeting,
  canManageArea,
  computeFlightReadiness,
  getAreaCardStyle,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { CompetitionLesson, FlightCategory, LessonSeverity } from "@/lib/types";
import { AreaChip } from "./Badge";
import { GaugeRing } from "./Charts";

const FLIGHT_CAT_LABEL: Record<FlightCategory, string> = {
  estrutural: "Estrutural",
  aerodinamica: "Aerodinâmica & Superfícies",
  propulsao: "Propulsão & Elétrica",
  cg_peso: "CG & Peso",
  seguranca: "Segurança SAE",
};

const SEVERITY_META: Record<LessonSeverity, { label: string; badgeClass: string }> = {
  critico: { label: "Crítico", badgeClass: "border-rose-500/45 bg-rose-500/15 text-rose-400" },
  alto: { label: "Alto", badgeClass: "border-amber-500/45 bg-amber-500/15 text-amber-400" },
  medio: { label: "Médio", badgeClass: "border-sky-500/45 bg-sky-500/15 text-sky-400" },
};

export function FlightLessonsView() {
  const {
    state,
    currentUser,
    toggleFlightCheckItem,
    addFlightCheckItem,
    resetFlightChecklist,
    addCompetitionLesson,
    updateCompetitionLesson,
    toggleLessonResolved,
    deleteCompetitionLesson,
  } = useZeus();

  const [showCheckForm, setShowCheckForm] = useState(false);
  const [checkCat, setCheckCat] = useState<FlightCategory>("seguranca");
  const [checkAreaId, setCheckAreaId] = useState("integracao");
  const [checkTitle, setCheckTitle] = useState("");
  const [checkNotes, setCheckNotes] = useState("");
  const [checkCritical, setCheckCritical] = useState(true);

  const [lessonScope, setLessonScope] = useState<"all" | "season">("all");
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lesAreaId, setLesAreaId] = useState(currentUser.areaIds[0] ?? "integracao");
  const [lesSeverity, setLesSeverity] = useState<LessonSeverity>("critico");
  const [lesTitle, setLesTitle] = useState("");
  const [lesRoot, setLesRoot] = useState("");
  const [lesPrevention, setLesPrevention] = useState("");
  const [lesImpacted, setLesImpacted] = useState<string[]>([]);

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLesTitle, setEditLesTitle] = useState("");
  const [editLesRoot, setEditLesRoot] = useState("");
  const [editLesPrev, setEditLesPrev] = useState("");
  const [editLesSev, setEditLesSev] = useState<LessonSeverity>("critico");

  const seasonChecks = state.flightChecklist.filter((f) => f.seasonYear === state.activeSeason);
  const readiness = computeFlightReadiness(seasonChecks);
  const canManageFlight =
    canApproveInMeeting(currentUser) ||
    ZEUS_AREAS.some((a) => canManageArea(currentUser, a.id));
  const isTop = canApproveInMeeting(currentUser);

  const displayedLessons = state.competitionLessons.filter(
    (l) => lessonScope === "all" || l.seasonYear === state.activeSeason
  );

  const handleAddCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkTitle.trim()) return;
    addFlightCheckItem({
      category: checkCat,
      areaId: checkAreaId || undefined,
      title: checkTitle.trim(),
      critical: checkCritical,
      notes: checkNotes.trim(),
    });
    setCheckTitle("");
    setCheckNotes("");
    setShowCheckForm(false);
  };

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesTitle.trim()) return;
    addCompetitionLesson({
      seasonYear: state.activeSeason,
      areaId: lesAreaId,
      severity: lesSeverity,
      title: lesTitle.trim(),
      rootCause: lesRoot.trim(),
      preventionAction: lesPrevention.trim(),
      impactedAreaIds: lesImpacted.filter((id) => id !== lesAreaId),
    });
    setLesTitle("");
    setLesRoot("");
    setLesPrevention("");
    setLesImpacted([]);
    setShowLessonForm(false);
  };

  const startEditLesson = (les: CompetitionLesson) => {
    setEditingLessonId(les.id);
    setEditLesTitle(les.title);
    setEditLesRoot(les.rootCause);
    setEditLesPrev(les.preventionAction);
    setEditLesSev(les.severity);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-400" />
            Checklist da Aeronave & Erros da Competição
          </h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Validação técnica antes dos voos de teste + registro de falhas passadas que não podem se repetir na SAE Brasil.
          </p>
        </div>

        <div className="zeus-card rounded-xl px-4 py-2.5 flex items-center gap-3">
          <GaugeRing percentage={readiness.percentage} />
          <div>
            <div className="text-[11px] text-[var(--ink-subtle)]">
              Pronto para Voo (ZEUS {state.activeSeason})
            </div>
            <div className="font-mono text-sm font-semibold">
              {readiness.checked}/{readiness.total} itens
              {readiness.criticalPending > 0 ? (
                <span className="ml-2 text-rose-400">
                  · {readiness.criticalPending} crítico(s) pendente(s)
                </span>
              ) : (
                <span className="ml-2 text-emerald-400">· Críticos OK</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Flight Readiness Checklist */}
        <section className="zeus-card rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Checklist de Funcionamento do Avião
            </h2>
            <div className="flex items-center gap-1.5">
              {isTop && (
                <button
                  type="button"
                  onClick={resetFlightChecklist}
                  className="rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] inline-flex items-center gap-1 hover:text-amber-400"
                >
                  <RotateCcw className="h-3 w-3" /> Novo Ensaio
                </button>
              )}
              {canManageFlight && (
                <button
                  type="button"
                  onClick={() => setShowCheckForm((v) => !v)}
                  className="zeus-btn rounded-md bg-blue-600 hover:bg-blue-500 px-2.5 py-1 text-[11px] font-semibold text-white inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Item
                </button>
              )}
            </div>
          </div>

          {showCheckForm && canManageFlight && (
            <form
              onSubmit={handleAddCheck}
              className="zeus-surface-2 rounded-lg p-3 border border-[var(--hairline)] space-y-2"
            >
              <input
                type="text"
                placeholder="Verificação obrigatória (ex.: Teste de alcance do rádio)"
                value={checkTitle}
                onChange={(e) => setCheckTitle(e.target.value)}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={checkCat}
                  onChange={(e) => setCheckCat(e.target.value as FlightCategory)}
                  className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1.5 text-xs"
                >
                  {(Object.keys(FLIGHT_CAT_LABEL) as FlightCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {FLIGHT_CAT_LABEL[c]}
                    </option>
                  ))}
                </select>
                <select
                  value={checkAreaId}
                  onChange={(e) => setCheckAreaId(e.target.value)}
                  className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1.5 text-xs"
                >
                  {ZEUS_AREAS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Critério / observação de inspeção"
                value={checkNotes}
                onChange={(e) => setCheckNotes(e.target.value)}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
              />
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-1.5 text-xs text-rose-400">
                  <input
                    type="checkbox"
                    checked={checkCritical}
                    onChange={(e) => setCheckCritical(e.target.checked)}
                  />
                  Item crítico (impede voo se pendente)
                </label>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Adicionar
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {seasonChecks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--hairline)] p-6 text-center text-xs text-[var(--ink-subtle)]">
                Nenhum item de checklist para ZEUS {state.activeSeason} ainda.
              </div>
            ) : (
              seasonChecks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleFlightCheckItem(item.id)}
                  className={`w-full text-left rounded-lg border p-3 flex items-start gap-2.5 transition-colors ${
                    item.checked
                      ? "border-emerald-500/35 bg-emerald-500/10"
                      : item.critical
                      ? "border-rose-500/35 bg-rose-500/5"
                      : "border-[var(--hairline)] bg-[var(--surface-2)]/60"
                  }`}
                >
                  {item.checked ? (
                    <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-4 w-4 text-[var(--ink-subtle)] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] text-sky-400">
                        {FLIGHT_CAT_LABEL[item.category]}
                      </span>
                      {item.areaId && <AreaChip areaId={item.areaId} subtle />}
                      {item.critical && (
                        <span className="rounded bg-rose-500/20 text-rose-400 px-1.5 py-0.2 text-[9px] font-semibold">
                          CRÍTICO
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-medium ${item.checked ? "line-through text-[var(--ink-subtle)]" : ""}`}>
                      {item.title}
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-[var(--ink-subtle)]">{item.notes}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Competition Lessons & Errors ("Nunca Mais Repetir") */}
        <section className="zeus-card rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Erros da Competição · Nunca Mais Repetir
              </h2>
              <p className="text-[11px] text-[var(--ink-subtle)]">
                Falhas passadas documentadas e ligadas às áreas afetadas no Grafo Obsidian.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="inline-flex rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setLessonScope("all")}
                  className={`rounded px-2 py-0.5 ${
                    lessonScope === "all" ? "bg-blue-600 text-white" : "text-[var(--ink-subtle)]"
                  }`}
                >
                  Tudo
                </button>
                <button
                  type="button"
                  onClick={() => setLessonScope("season")}
                  className={`rounded px-2 py-0.5 ${
                    lessonScope === "season" ? "bg-blue-600 text-white" : "text-[var(--ink-subtle)]"
                  }`}
                >
                  {state.activeSeason}
                </button>
              </div>
              {canManageFlight && (
                <button
                  type="button"
                  onClick={() => setShowLessonForm((v) => !v)}
                  className="zeus-btn rounded-md bg-amber-500 hover:bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-zinc-950 inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Registrar Erro
                </button>
              )}
            </div>
          </div>

          {showLessonForm && canManageFlight && (
            <form
              onSubmit={handleAddLesson}
              className="zeus-surface-2 rounded-lg p-3 border border-[var(--hairline)] space-y-2"
            >
              <input
                type="text"
                placeholder="Erro ou falha ocorrida na competição / ensaio..."
                value={lesTitle}
                onChange={(e) => setLesTitle(e.target.value)}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={lesAreaId}
                  onChange={(e) => setLesAreaId(e.target.value)}
                  className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1.5 text-xs"
                >
                  {ZEUS_AREAS.filter((a) => canManageArea(currentUser, a.id)).map((a) => (
                    <option key={a.id} value={a.id}>
                      Área: {a.name}
                    </option>
                  ))}
                </select>
                <select
                  value={lesSeverity}
                  onChange={(e) => setLesSeverity(e.target.value as LessonSeverity)}
                  className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1.5 text-xs"
                >
                  <option value="critico">Severidade: Crítico</option>
                  <option value="alto">Severidade: Alto</option>
                  <option value="medio">Severidade: Médio</option>
                </select>
              </div>
              <textarea
                rows={2}
                placeholder="Causa raiz (por que aconteceu?)..."
                value={lesRoot}
                onChange={(e) => setLesRoot(e.target.value)}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
              />
              <textarea
                rows={2}
                placeholder="Regra de prevenção (o que fazer para não ocorrer mais)..."
                value={lesPrevention}
                onChange={(e) => setLesPrevention(e.target.value)}
                className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
              />
              <div className="flex flex-wrap gap-1">
                {ZEUS_AREAS.filter((a) => a.id !== lesAreaId).map((a) => {
                  const active = lesImpacted.includes(a.id);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() =>
                        setLesImpacted((prev) =>
                          prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                        )
                      }
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                        active
                          ? "border-rose-500 bg-rose-500/15 text-rose-400"
                          : "border-[var(--hairline)] text-[var(--ink-subtle)]"
                      }`}
                    >
                      {a.shortCode}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950"
                >
                  Salvar Lição
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {displayedLessons.map((les) => {
              const sev = SEVERITY_META[les.severity];
              const canEdit = canManageArea(currentUser, les.areaId);
              const isEditing = editingLessonId === les.id;
              return (
                <div
                  key={les.id}
                  className={`rounded-xl border-[1.5px] p-3.5 space-y-2 ${
                    !les.resolved ? "ring-1 ring-rose-500/45" : ""
                  }`}
                  style={getAreaCardStyle(les.areaId, { emphasis: "medium" })}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editLesTitle}
                        onChange={(e) => setEditLesTitle(e.target.value)}
                        className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                      />
                      <select
                        value={editLesSev}
                        onChange={(e) => setEditLesSev(e.target.value as LessonSeverity)}
                        className="rounded border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                      >
                        <option value="critico">Crítico</option>
                        <option value="alto">Alto</option>
                        <option value="medio">Médio</option>
                      </select>
                      <textarea
                        rows={2}
                        value={editLesRoot}
                        onChange={(e) => setEditLesRoot(e.target.value)}
                        className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                      />
                      <textarea
                        rows={2}
                        value={editLesPrev}
                        onChange={(e) => setEditLesPrev(e.target.value)}
                        className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingLessonId(null)}
                          className="rounded border border-[var(--hairline)] px-2 py-1 text-[11px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateCompetitionLesson(les.id, {
                              title: editLesTitle.trim() || les.title,
                              rootCause: editLesRoot.trim(),
                              preventionAction: editLesPrev.trim(),
                              severity: editLesSev,
                            });
                            setEditingLessonId(null);
                          }}
                          className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                        >
                          <Save className="h-3 w-3" /> Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${sev.badgeClass}`}>
                            <AlertTriangle className="h-3 w-3" /> {sev.label}
                          </span>
                          <AreaChip areaId={les.areaId} showName />
                          <span className="font-mono text-[10px] text-[var(--ink-subtle)]">
                            · {les.seasonYear}
                          </span>
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditLesson(les)}
                              className="text-[var(--ink-subtle)] hover:text-sky-400"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteCompetitionLesson(les.id)}
                              className="text-[var(--ink-subtle)] hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-semibold">{les.title}</div>
                      {les.rootCause && (
                        <div className="text-[11px] text-[var(--ink-muted)]">
                          <strong>Causa raiz:</strong> {les.rootCause}
                        </div>
                      )}
                      {les.preventionAction && (
                        <div className="text-[11px] text-emerald-400/90">
                          <strong>Como evitar:</strong> {les.preventionAction}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--hairline)]">
                        <div className="flex flex-wrap gap-1">
                          {les.impactedAreaIds.map((id) => (
                            <AreaChip key={id} areaId={id} subtle />
                          ))}
                        </div>
                        <button
                          disabled={!canEdit}
                          onClick={() => toggleLessonResolved(les.id)}
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-medium disabled:opacity-60 ${
                            les.resolved
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                              : "border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
                          }`}
                        >
                          {les.resolved ? "Mitigado no projeto" : "Marcar como mitigado"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
