"use client";

import { useState } from "react";
import { CheckSquare, ExternalLink, GitBranch, Lock, Plus, Square, Trash2 } from "lucide-react";
import {
  canManageArea,
  canViewPrivateArea,
  computeReportPercentage,
  computeTeamReportPercentage,
  getAreaName,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import { AreaChip, RoleBadge } from "./Badge";
import { GaugeRing } from "./Charts";
import { MemberAvatar } from "./MemberAvatar";

export function AreasView({
  onOpenProfile,
}: {
  onOpenProfile: (memberId: string) => void;
}) {
  const {
    state,
    currentUser,
    toggleReportSection,
    addReportSection,
    setReportOverride,
    saveAreaNote,
    deleteAreaNote,
  } = useZeus();

  const [selectedAreaId, setSelectedAreaId] = useState(
    currentUser.areaIds[0] ?? ZEUS_AREAS[0].id
  );
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionImpacted, setSectionImpacted] = useState<string[]>([]);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteUrl, setNoteUrl] = useState("");

  const area = ZEUS_AREAS.find((a) => a.id === selectedAreaId) ?? ZEUS_AREAS[0];
  const areaMembers = state.members.filter(
    (m) => m.accountStatus === "approved" && m.areaIds.includes(area.id)
  );
  const areaSections = state.reportSections.filter((r) => r.areaId === area.id);
  const override = state.reportOverrides[area.id] ?? null;
  const pct = computeReportPercentage(area.id, state.reportSections, override);
  const { teamPercentage } = computeTeamReportPercentage(
    ZEUS_AREAS,
    state.reportSections,
    state.reportOverrides
  );

  // Cross-area dependencies for the selected report
  const feedsIntoAreaIds = Array.from(
    new Set([
      ...areaSections.flatMap((s) => s.impactedAreaIds),
      ...state.tasks.filter((t) => t.areaId === area.id).flatMap((t) => t.impactedAreaIds),
    ])
  ).filter((id) => id !== area.id);

  const receivesFromAreaIds = Array.from(
    new Set([
      ...state.reportSections
        .filter((s) => s.areaId !== area.id && s.impactedAreaIds.includes(area.id))
        .map((s) => s.areaId),
      ...state.tasks
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
      {/* Top Dual Banner: Team Report % vs Selected Area Report % */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Áreas, Relatórios SAE & Espaço Privado</h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Cada área entrega seu relatório separado, mas depende das outras áreas para fechar a nota final da competição.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="zeus-card rounded-xl px-3.5 py-2 flex items-center gap-3">
            <GaugeRing percentage={teamPercentage} />
            <div>
              <div className="text-[11px] text-[var(--ink-subtle)]">Relatório Geral da Equipe</div>
              <div className="font-mono text-sm font-semibold text-sky-400">
                {teamPercentage}% (11 áreas)
              </div>
            </div>
          </div>

          <div className="zeus-card rounded-xl px-3.5 py-2 flex items-center gap-3 border-amber-500/40">
            <GaugeRing percentage={pct} />
            <div>
              <div className="text-[11px] text-[var(--ink-subtle)]">Relatório · {area.shortCode}</div>
              <div className="font-mono text-sm font-semibold text-amber-400">
                {pct}% ({area.name})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 11 Areas Grid Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {ZEUS_AREAS.map((a) => {
          const active = a.id === area.id;
          const aPct = computeReportPercentage(a.id, state.reportSections, state.reportOverrides[a.id]);
          const hasAccess = canViewPrivateArea(currentUser, a.id);
          return (
            <button
              key={a.id}
              onClick={() => setSelectedAreaId(a.id)}
              className={`zeus-card-interactive text-left rounded-xl border p-3 ${
                active
                  ? "zeus-nav-active"
                  : "border-[var(--hairline)] bg-[var(--surface-1)]"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] text-blue-500">{a.shortCode}</span>
                <span className="font-mono text-xs font-semibold text-amber-500">{aPct}%</span>
              </div>
              <div className="mt-1 text-xs font-medium truncate">{a.name}</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${aPct}%` }}
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
        {/* Report Checklist & Cross-Area Dependencies */}
        <section className="zeus-card rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Relatório Individual — {area.name}</h2>
              <p className="text-xs text-[var(--ink-subtle)]">{area.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono text-xl font-semibold text-amber-400">{pct}%</div>
              <div className="text-[10px] text-[var(--ink-subtle)]">
                {override !== null ? "Ajuste manual" : "Automático"}
              </div>
            </div>
          </div>

          {/* Cross-area dependency summary */}
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
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-sky-300"
                      >
                        {getAreaName(id)}
                      </span>
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
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300"
                      >
                        {getAreaName(id)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {canEditArea && (
            <div className="zeus-surface-2 rounded-md p-2.5 border border-[var(--hairline)] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[var(--ink-subtle)]">Ajuste manual (% na sala):</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pct}
                  onChange={(e) => setReportOverride(area.id, Number(e.target.value))}
                  className="accent-amber-500"
                />
                {override !== null && (
                  <button
                    onClick={() => setReportOverride(area.id, null)}
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
                Nenhum tópico cadastrado ainda para o relatório desta área.
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
                  {sec.impactedAreaIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {sec.impactedAreaIds.map((id) => (
                        <AreaChip key={id} areaId={id} subtle />
                      ))}
                    </div>
                  )}
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
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() =>
                        setSectionImpacted((prev) =>
                          prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                        )
                      }
                      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                        selected
                          ? "border-amber-500 bg-amber-500/15 text-amber-400"
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

        {/* Private Area Space */}
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
              <form onSubmit={handleSaveNote} className="zeus-surface-2 rounded-md p-3 border border-[var(--hairline)] space-y-2">
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
                    return (
                      <div
                        key={note.id}
                        className="rounded-md border border-[var(--hairline)] p-3 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold">{note.title}</div>
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
                        <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{note.content}</p>
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
