"use client";

import { useState } from "react";
import {
  Archive,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { canManageArea, getAreaCardStyle, ZEUS_AREAS } from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { ArchiveDocType, ArchiveDocument } from "@/lib/types";
import { AreaChip } from "./Badge";

const DOC_TYPE_META: Record<ArchiveDocType, { label: string; badgeClass: string }> = {
  relatorio: { label: "Relatório SAE", badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-400" },
  planilha: { label: "Planilha", badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" },
  cad: { label: "CAD / Planta", badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-400" },
  apresentacao: { label: "Apresentação", badgeClass: "border-blue-500/40 bg-blue-500/15 text-blue-400" },
  ata: { label: "Ata / Reunião", badgeClass: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300" },
};

export function ArchiveView() {
  const {
    state,
    currentUser,
    addArchiveDocument,
    updateArchiveDocument,
    deleteArchiveDocument,
  } = useZeus();
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ArchiveDocType>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [seasonYear, setSeasonYear] = useState<number>(state.activeSeason);
  const [areaId, setAreaId] = useState(currentUser.areaIds[0] ?? "aerodinamica");
  const [docType, setDocType] = useState<ArchiveDocType>("relatorio");
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [impactedAreaIds, setImpactedAreaIds] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editType, setEditType] = useState<ArchiveDocType>("relatorio");
  const [editYear, setEditYear] = useState<number>(2026);

  const manageableAreas = ZEUS_AREAS.filter((a) => canManageArea(currentUser, a.id));
  const years = Array.from(
    new Set([2027, 2026, 2025, 2024, ...state.archiveDocuments.map((d) => d.seasonYear)])
  ).sort((a, b) => b - a);

  const filtered = state.archiveDocuments.filter((doc) => {
    if (yearFilter !== "all" && doc.seasonYear !== Number(yearFilter)) return false;
    if (areaFilter !== "all" && doc.areaId !== areaFilter) return false;
    if (typeFilter !== "all" && doc.docType !== typeFilter) return false;
    if (
      search.trim() &&
      !doc.title.toLowerCase().includes(search.toLowerCase()) &&
      !doc.summary.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !externalUrl.trim()) return;
    addArchiveDocument({
      seasonYear,
      areaId,
      docType,
      title: title.trim(),
      externalUrl: externalUrl.trim(),
      summary: summary.trim(),
      impactedAreaIds: impactedAreaIds.filter((id) => id !== areaId),
    });
    setTitle("");
    setExternalUrl("");
    setSummary("");
    setImpactedAreaIds([]);
    setShowForm(false);
  };

  const startEdit = (doc: ArchiveDocument) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
    setEditSummary(doc.summary);
    setEditUrl(doc.externalUrl);
    setEditType(doc.docType);
    setEditYear(doc.seasonYear);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-400" />
            Acervo Histórico · Relatórios & Links (Teams / Drive)
          </h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Banco central de relatórios antigos, planilhas e CADs por ano e área — cada conexão cadastrada aparece ligada no Grafo Obsidian.
          </p>
        </div>

        {manageableAreas.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="zeus-btn self-start inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Arquivo / Link
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="zeus-card rounded-xl p-3 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="h-3.5 w-3.5 text-[var(--ink-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar relatório, ano ou assunto..."
            className="w-full h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] pl-8 pr-2.5 text-xs"
          />
        </div>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
        >
          <option value="all">Todos os anos</option>
          {years.map((y) => (
            <option key={y} value={y}>
              Temporada {y}
            </option>
          ))}
        </select>

        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
        >
          <option value="all">Todas as áreas</option>
          {ZEUS_AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.shortCode} · {a.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | ArchiveDocType)}
          className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
        >
          <option value="all">Todos os tipos</option>
          {(Object.keys(DOC_TYPE_META) as ArchiveDocType[]).map((t) => (
            <option key={t} value={t}>
              {DOC_TYPE_META[t].label}
            </option>
          ))}
        </select>
      </div>

      {showForm && manageableAreas.length > 0 && (
        <form onSubmit={handleSubmit} className="zeus-card rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold">Registrar documento ou link do Teams / Drive</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              placeholder="Título (ex.: Relatório Aerodinâmica 2025)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="number"
              min={2018}
              max={2030}
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
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
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as ArchiveDocType)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              {(Object.keys(DOC_TYPE_META) as ArchiveDocType[]).map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPE_META[t].label}
                </option>
              ))}
            </select>
            <input
              type="url"
              placeholder="Link do SharePoint / Teams / Google Drive"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Resumo do conteúdo (principais conclusões, dados de referência)..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
          <div>
            <div className="text-[11px] text-[var(--ink-subtle)] mb-1">
              Áreas conectadas (aparece ligado no Grafo Obsidian):
            </div>
            <div className="flex flex-wrap gap-1">
              {ZEUS_AREAS.filter((a) => a.id !== areaId).map((a) => {
                const selected = impactedAreaIds.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() =>
                      setImpactedAreaIds((prev) =>
                        prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                      )
                    }
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
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
          </div>
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
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
            >
              Salvar no Acervo
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 zeus-card rounded-xl p-8 text-center text-sm text-[var(--ink-subtle)]">
            Nenhum documento encontrado para os filtros aplicados.
          </div>
        ) : (
          filtered.map((doc) => {
            const meta = DOC_TYPE_META[doc.docType];
            const canEdit = canManageArea(currentUser, doc.areaId);
            const isEditing = editingId === doc.id;
            const Icon =
              doc.docType === "planilha"
                ? FileSpreadsheet
                : doc.docType === "cad"
                ? FolderKanban
                : FileText;

            return (
              <div
                key={doc.id}
                className="zeus-card rounded-xl p-4 space-y-2.5 border-[1.5px]"
                style={getAreaCardStyle(doc.areaId, { emphasis: "medium" })}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as ArchiveDocType)}
                        className="rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                      >
                        {(Object.keys(DOC_TYPE_META) as ArchiveDocType[]).map((t) => (
                          <option key={t} value={t}>
                            {DOC_TYPE_META[t].label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={editYear}
                        onChange={(e) => setEditYear(Number(e.target.value))}
                        className="rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                      />
                    </div>
                    <input
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                    />
                    <textarea
                      rows={2}
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className="w-full rounded border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded border border-[var(--hairline)] px-2 py-1 text-[11px]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateArchiveDocument(doc.id, {
                            title: editTitle.trim() || doc.title,
                            summary: editSummary.trim(),
                            externalUrl: editUrl.trim() || doc.externalUrl,
                            docType: editType,
                            seasonYear: editYear,
                          });
                          setEditingId(null);
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
                        <span className="rounded bg-blue-600/20 border border-blue-500/40 px-1.5 py-0.5 font-mono text-[10px] text-sky-400">
                          {doc.seasonYear}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.badgeClass}`}
                        >
                          <Icon className="h-3 w-3" /> {meta.label}
                        </span>
                        <AreaChip areaId={doc.areaId} showName />
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(doc)}
                            title="Editar documento"
                            className="text-[var(--ink-subtle)] hover:text-sky-400"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteArchiveDocument(doc.id)}
                            title="Remover do acervo"
                            className="text-[var(--ink-subtle)] hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-sm font-semibold">{doc.title}</div>
                    {doc.summary && (
                      <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{doc.summary}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--hairline)]">
                      <div className="flex flex-wrap gap-1">
                        {doc.impactedAreaIds.map((id) => (
                          <AreaChip key={id} areaId={id} subtle />
                        ))}
                      </div>
                      <a
                        href={doc.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:underline"
                      >
                        Abrir documento <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
