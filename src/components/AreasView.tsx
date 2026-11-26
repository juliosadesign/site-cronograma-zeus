"use client";

import { useState } from "react";
import {
  Briefcase,
  CheckSquare,
  Edit3,
  ExternalLink,
  GitBranch,
  Lock,
  Plus,
  Save,
  Square,
  Trash2,
} from "lucide-react";
import {
  canManageArea,
  canViewPrivateArea,
  computeProjectedReportScore,
  computeReportPercentage,
  computeTeamReportPercentage,
  CORPORATE_AREAS,
  getAreaMeta,
  getAreaName,
  getReportOverride,
  TECHNICAL_AREAS,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { NavTab } from "./AppShell";
import { AreaChip, RoleBadge } from "./Badge";
import { GaugeRing } from "./Charts";
import { MemberAvatar } from "./MemberAvatar";

export function AreasView({
  onOpenProfile,
  onNavigate,
}: {
  onOpenProfile: (memberId: string) => void;
  onNavigate?: (tab: NavTab) => void;
}) {
  const {
    state,
    currentUser,
    toggleReportSection,
    addReportSection,
    updateReportSectionScore,
    setReportOverride,
    saveAreaNote,
    updateAreaNote,
    deleteAreaNote,
  } = useZeus();

  const defaultTech =
    currentUser.areaIds.find((id) => TECHNICAL_AREAS.some((t) => t.id === id)) ??
    TECHNICAL_AREAS[0].id;
  const [selectedAreaId, setSelectedAreaId] = useState(defaultTech);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionImpacted, setSectionImpacted] = useState<string[]>([]);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteUrl, setNoteUrl] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");
  const [editNoteUrl, setEditNoteUrl] = useState("");

  const seasonReports = state.reportSections.filter(
    (r) => r.seasonYear === state.activeSeason
  );
  const area = TECHNICAL_AREAS.find((a) => a.id === selectedAreaId) ?? TECHNICAL_AREAS[0];
  const areaMembers = state.members.filter(
    (m) => m.accountStatus === "approved" && m.areaIds.includes(area.id)
  );
  const areaSections = seasonReports.filter((r) => r.areaId === area.id);
  const override = getReportOverride(state.reportOverrides, state.activeSeason, area.id);
  const pct = computeReportPercentage(area.id, seasonReports, override);
  const areaScore = computeProjectedReportScore(seasonReports, area.id);
  const teamScore = computeProjectedReportScore(
    seasonReports.filter((r) => TECHNICAL_AREAS.some((t) => t.id === r.areaId))
  );
  const { teamPercentage } = computeTeamReportPercentage(
    TECHNICAL_AREAS,
    seasonReports,
    state.reportOverrides,
    state.activeSeason
  );

  const seasonSprintIds = new Set(
    state.sprints.filter((sp) => sp.seasonYear === state.activeSeason).map((sp) => sp.id)
  );
  const seasonTasks = state.tasks.filter((t) => seasonSprintIds.has(t.sprintId));

  const feedsIntoAreaIds = Array.from(
    new Set([
      ...areaSections.flatMap((s) => s.impactedAreaIds),
      ...seasonTasks.filter((t) => t.areaId === area.id).flatMap((t) => t.impactedAreaIds),
    ])
  ).filter((id) => id !== area.id);

  const receivesFromAreaIds = Array.from(
    new Set([
      ...seasonReports
        .filter((s) => s.areaId !== area.id && s.impactedAreaIds.includes(area.id))
        .map((s) => s.areaId),
      ...seasonTasks
        .filter((t) => t.areaId !== area.id && t.impactedAreaIds.includes(area.id))
        .map((t) => t.areaId),
    ])
  );

  const canEditArea = canManageArea(currentUser, area.id);
  const canSeePrivate = canViewPrivateArea(currentUser, area.id);
  const areaNotes = state.areaNotes.filter((n) => n.areaId === area.id);

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;
    addReportSection({
      areaId: area.id,
      title: sectionTitle.trim(),
      impactedAreaIds: sectionImpacted,
    });
    setSectionTitle("");
    setSectionImpacted([]);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    saveAreaNote({
      areaId: area.id,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      externalUrl: noteUrl.trim() || undefined,
    });
    setNoteTitle("");
    setNoteContent("");
    setNoteUrl("");
  };

  return (
    <div className="space-y-5">
      {/* Top Dual Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Áreas Técnicas SAE & Espaço Privado ({state.activeSeason})
          </h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            As 8 áreas técnicas de engenharia da aeronave. Marketing, Gestão e Financeiro ficam na divisão Corporativa da barra lateral.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="zeus-card rounded-xl px-3.5 py-2 flex items-center gap-3">
            <GaugeRing percentage={teamPercentage} />
            <div>
              <div className="text-[11px] text-[var(--ink-subtle)]">Relatório Técnico Geral</div>
              <div className="font-mono text-sm font-semibold text-sky-400">
                {teamPercentage}% · {teamScore.earned}/{teamScore.max} pts
              </div>
            </div>
          </div>

          <div
            className="zeus-card rounded-xl px-3.5 py-2 flex items-center gap-3"
            style={{ borderColor: `${area.colorHex}77` }}
          >
            <GaugeRing percentage={pct} />
            <div>
              <div className="text-[11px] text-[var(--ink-subtle)]">Relatório · {area.shortCode}</div>
              <div className="font-mono text-sm font-semibold" style={{ color: area.colorHex }}>
                {pct}% · {areaScore.earned}/{areaScore.max} pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick link banner for Corporate divisions */}
      {onNavigate && (
        <div className="zeus-card rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 text-[var(--ink-subtle)]">
            <Briefcase className="h-3.5 w-3.5 text-amber-400" />
            Divisão Corporativa / Empresarial:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {CORPORATE_AREAS.map((corp) => (
              <button
                key={corp.id}
                type="button"
                onClick={() => onNavigate(corp.id as NavTab)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium hover:opacity-90"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: corp.colorHex }}
                />
                {corp.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 8 Technical Areas Grid Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {TECHNICAL_AREAS.map((a) => {
          const active = a.id === area.id;
          const aOverride = getReportOverride(state.reportOverrides, state.activeSeason, a.id);
          const aPct = computeReportPercentage(a.id, seasonReports, aOverride);
          const hasAccess = canViewPrivateArea(currentUser, a.id);
          return (
            <button
              key={a.id}
              onClick={() => setSelectedAreaId(a.id)}
              style={{
                borderColor: active ? a.colorHex : undefined,
                backgroundColor: active ? `${a.colorHex}14` : undefined,
                borderLeftWidth: "3px",
                borderLeftColor: a.colorHex,
              }}
              className="zeus-card-interactive text-left rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-3"
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className="font-mono text-[10px] font-bold flex items-center gap-1.5"
                  style={{ color: a.colorHex }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: a.colorHex }}
                  />
                  {a.shortCode}
                </span>
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">{aPct}%</span>
              </div>
              <div className="mt-1 text-xs font-medium truncate">{a.name}</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{ width: `${aPct}%`, backgroundColor: a.colorHex }}
                />
              </div>
              {!hasAccess && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-[var(--ink-subtle)]">
                  <Lock className="h-2.5 w-2.5" /> Privado restrito
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Area Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section
          className="zeus-card rounded-xl p-4 space-y-4"
          style={{ borderTopWidth: "3px", borderTopColor: area.colorHex }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: area.colorHex }}
                />
                Relatório Individual — {area.name}
              </h2>
              <p className="text-xs text-[var(--ink-subtle)]">{area.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-xl font-semibold" style={{ color: area.colorHex }}>
                {pct}%
              </div>
              <div className="text-[10px] text-[var(--ink-subtle)]">
                {override !== null ? `Ajuste manual (${state.activeSeason})` : "Automático"}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/60 p-3 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-sky-400">
              <GitBranch className="h-3.5 w-3.5" />
              Dependências entre Relatórios ({area.shortCode})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[var(--ink-subtle)] block mb-1">Recebe dados de:</span>
                {receivesFromAreaIds.length === 0 ? (
                  <span className="text-[var(--ink-subtle)]">Nenhuma mapeada ainda</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {receivesFromAreaIds.map((id) => (
                      <AreaChip key={id} areaId={id} showName />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span className="text-[var(--ink-subtle)] block mb-1">Alimenta os relatórios de:</span>
                {feedsIntoAreaIds.length === 0 ? (
                  <span className="text-[var(--ink-subtle)]">Nenhuma mapeada ainda</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {feedsIntoAreaIds.map((id) => (
                      <AreaChip key={id} areaId={id} showName />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {canEditArea && (
            <div className="zeus-surface-2 rounded-md p-2.5 border border-[var(--hairline)] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[var(--ink-subtle)]">
                Ajuste manual ({state.activeSeason}):
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) =>
                    setReportOverride(area.id, Number(e.target.value), state.activeSeason)
                  }
                  className="accent-amber-500"
                />
                {override !== null && (
                  <button
                    onClick={() => setReportOverride(area.id, null, state.activeSeason)}
                    className="rounded border border-[var(--hairline-strong)] px-2 py-0.5 text-[11px] hover:text-amber-400"
                  >
                    Voltar p/ automático
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {areaSections.length === 0 ? (
              <div className="text-xs text-[var(--ink-subtle)] py-3">
                Nenhum tópico cadastrado ainda para o relatório de {area.name} em {state.activeSeason}.
              </div>
            ) : (
              areaSections.map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-[var(--hairline)] p-2.5"
                >
                  <button
                    disabled={!canEditArea}
                    onClick={() => toggleReportSection(sec.id)}
                    className="flex items-start gap-2 text-left text-xs disabled:cursor-default"
                  >
                    {sec.completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-4 w-4 text-[var(--ink-subtle)] shrink-0 mt-0.5" />
                    )}
                    <span className={sec.completed ? "line-through text-[var(--ink-subtle)]" : ""}>
                      {sec.title}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {sec.impactedAreaIds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {sec.impactedAreaIds.map((id) => (
                          <AreaChip key={id} areaId={id} subtle />
                        ))}
                      </div>
                    )}
                    {canEditArea ? (
                      <label className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--ink-subtle)]">
                        <input
                          type="number"
                          min={0}
                          max={200}
                          value={sec.maxScore ?? 10}
                          onChange={(e) => updateReportSectionScore(sec.id, Number(e.target.value))}
                          className="w-12 rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-1 py-0.5 text-right text-[11px] text-[var(--ink)]"
                        />
                        pts
                      </label>
                    ) : (
                      <span className="font-mono text-[10px] text-[var(--ink-subtle)]">
                        {sec.maxScore ?? 10} pts
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {canEditArea && (
            <form onSubmit={handleAddSection} className="pt-2 border-t border-[var(--hairline)] space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Adicionar tópico ao checklist do relatório..."
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="flex-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-zinc-950"
                >
                  <Plus className="h-3.5 w-3.5" /> Tópico
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-[var(--ink-subtle)] mr-1">Conecta com:</span>
                {ZEUS_AREAS.filter((a) => a.id !== area.id).map((a) => {
                  const selected = sectionImpacted.includes(a.id);
                  const meta = getAreaMeta(a.id);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() =>
                        setSectionImpacted((prev) =>
                          prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                        )
                      }
                      style={selected ? { borderColor: meta.colorHex, color: meta.colorHex } : undefined}
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                        selected
                          ? "bg-[var(--surface-2)]"
                          : "border-[var(--hairline)] text-[var(--ink-subtle)]"
                      }`}
                    >
                      {a.shortCode}
                    </button>
                  );
                })}
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-[var(--hairline)]">
            <div className="text-[11px] font-medium text-[var(--ink-subtle)] mb-2">
              Membros em {area.name} ({areaMembers.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {areaMembers.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => onOpenProfile(m.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] hover:border-[var(--hairline-strong)] px-2 py-1 text-xs"
                >
                  <MemberAvatar member={m} size="sm" />
                  <span>{m.fullName}</span>
                  <RoleBadge role={m.role} />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Private Area Space with inline Edit */}
        <section className="zeus-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              Espaço Privado — {area.name}
            </h2>
            <span className="text-[11px] text-[var(--ink-subtle)]">Acesso restrito</span>
          </div>

          {!canSeePrivate ? (
            <div className="rounded-lg border border-dashed border-[var(--hairline-strong)] p-8 text-center space-y-2">
              <Lock className="h-6 w-6 mx-auto text-[var(--ink-subtle)]" />
              <div className="text-sm font-medium">Área Restrita</div>
              <p className="text-xs text-[var(--ink-subtle)] max-w-sm mx-auto">
                Apenas membros de <strong>{area.name}</strong>, Capitães e o Desenvolvedor podem visualizar rascunhos internos e notas privadas desta área.
              </p>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSaveNote}
                className="zeus-surface-2 rounded-md p-3 border border-[var(--hairline)] space-y-2"
              >
                <input
                  type="text"
                  placeholder="Título da anotação ou rascunho..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                />
                <textarea
                  rows={2}
                  placeholder="Notas técnicas internas da área (trade-offs, decisões, links de Drive)..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="Link opcional (Drive/Overleaf/CAD)"
                    value={noteUrl}
                    onChange={(e) => setNoteUrl(e.target.value)}
                    className="flex-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
                  >
                    Salvar nota privada
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                {areaNotes.length === 0 ? (
                  <div className="text-xs text-[var(--ink-subtle)] py-4 text-center">
                    Nenhuma anotação privada nesta área ainda.
                  </div>
                ) : (
                  areaNotes.map((note) => {
                    const author = state.members.find((m) => m.id === note.authorId);
                    const isEditing = editingNoteId === note.id;
                    const canModify = canEditArea || note.authorId === currentUser.id;
                    return (
                      <div
                        key={note.id}
                        className="rounded-md border border-[var(--hairline)] p-3 space-y-2"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editNoteTitle}
                              onChange={(e) => setEditNoteTitle(e.target.value)}
                              className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                            />
                            <textarea
                              rows={2}
                              value={editNoteContent}
                              onChange={(e) => setEditNoteContent(e.target.value)}
                              className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                            />
                            <input
                              type="url"
                              placeholder="Link opcional"
                              value={editNoteUrl}
                              onChange={(e) => setEditNoteUrl(e.target.value)}
                              className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="rounded border border-[var(--hairline)] px-2 py-1 text-[11px]"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateAreaNote(note.id, {
                                    title: editNoteTitle.trim() || note.title,
                                    content: editNoteContent.trim(),
                                    externalUrl: editNoteUrl.trim() || undefined,
                                  });
                                  setEditingNoteId(null);
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
                              <div className="text-xs font-semibold">{note.title}</div>
                              <div className="flex items-center gap-1.5">
                                {canModify && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNoteId(note.id);
                                      setEditNoteTitle(note.title);
                                      setEditNoteContent(note.content);
                                      setEditNoteUrl(note.externalUrl ?? "");
                                    }}
                                    title="Editar nota"
                                    className="text-[var(--ink-subtle)] hover:text-sky-400"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {canEditArea && (
                                  <button
                                    onClick={() => deleteAreaNote(note.id)}
                                    title="Excluir nota"
                                    className="text-[var(--ink-subtle)] hover:text-rose-500"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                              {note.content}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-[var(--ink-subtle)]">
                              <span>
                                {author?.fullName ?? "Membro"} · {note.updatedAt}
                              </span>
                              {note.externalUrl && (
                                <a
                                  href={note.externalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                                >
                                  Abrir link <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
