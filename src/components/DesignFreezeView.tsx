"use client";

import { useState } from "react";
import { ExternalLink, GitCommitHorizontal, Lock, Plus, Trash2 } from "lucide-react";
import { buildTintedCardStyle, canManageArea, isTopLeadership } from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { AircraftConcept, AircraftRevisionStatus } from "@/lib/types";

const REV_STATUS_META: Record<
  AircraftRevisionStatus,
  { label: string; badgeClass: string; next: AircraftRevisionStatus }
> = {
  draft: {
    label: "Rascunho",
    badgeClass: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300",
    next: "frozen",
  },
  frozen: {
    label: "Congelada (Design Freeze)",
    badgeClass: "border-sky-500/45 bg-sky-500/15 text-sky-300",
    next: "competition",
  },
  competition: {
    label: "Configuração Competição",
    badgeClass: "border-amber-500/45 bg-amber-500/15 text-amber-300",
    next: "draft",
  },
};

const CONCEPT_LABEL: Record<AircraftConcept, string> = {
  monoplano: "Monoplano Convencional",
  biplano: "Biplano",
  asa_voadora: "Asa Voadora",
};

export function DesignFreezeView() {
  const {
    state,
    currentUser,
    addAircraftRevision,
    updateAircraftRevisionStatus,
    deleteAircraftRevision,
  } = useZeus();

  const canManage =
    isTopLeadership(currentUser.role) ||
    canManageArea(currentUser, "integracao") ||
    canManageArea(currentUser, "aerodinamica") ||
    canManageArea(currentUser, "estruturas");

  const [showForm, setShowForm] = useState(false);
  const [versionTag, setVersionTag] = useState("Rev 3.0");
  const [title, setTitle] = useState("");
  const [concept, setConcept] = useState<AircraftConcept>("monoplano");
  const [status, setStatus] = useState<AircraftRevisionStatus>("draft");
  const [mtowKg, setMtowKg] = useState("");
  const [payloadKg, setPayloadKg] = useState("");
  const [cgPercent, setCgPercent] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [notes, setNotes] = useState("");

  const seasonRevs = state.aircraftRevisions.filter(
    (r) => r.seasonYear === state.activeSeason
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTag.trim() || !title.trim()) return;
    addAircraftRevision({
      seasonYear: state.activeSeason,
      versionTag: versionTag.trim(),
      title: title.trim(),
      concept,
      status,
      mtowKg: mtowKg ? Number(mtowKg) : undefined,
      payloadKg: payloadKg ? Number(payloadKg) : undefined,
      cgPercent: cgPercent ? Number(cgPercent) : undefined,
      externalUrl: externalUrl.trim() || undefined,
      notes: notes.trim(),
    });
    setTitle("");
    setNotes("");
    setExternalUrl("");
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <GitCommitHorizontal className="h-5 w-5 text-teal-400" />
            Marcos de Versão da Aeronave · Design Freeze ({state.activeSeason})
          </h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Snapshots oficiais de engenharia (Rev 1.0, Rev 2.0...) com MTOW, Carga Paga, CG e CAD congelado para evitar divergências entre áreas.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="zeus-btn self-start inline-flex items-center gap-1.5 rounded-md bg-teal-500 hover:bg-teal-400 px-3 py-1.5 text-xs font-semibold text-zinc-950"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar Revisão
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleAdd} className="zeus-card rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold">Congelar / Registrar Nova Revisão</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              placeholder="Tag (ex.: Rev 2.1)"
              value={versionTag}
              onChange={(e) => setVersionTag(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder="Título do marco técnico..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AircraftRevisionStatus)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="draft">Rascunho</option>
              <option value="frozen">Congelada (Freeze)</option>
              <option value="competition">Configuração Competição</option>
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <select
              value={concept}
              onChange={(e) => setConcept(e.target.value as AircraftConcept)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="monoplano">Monoplano</option>
              <option value="biplano">Biplano</option>
              <option value="asa_voadora">Asa Voadora</option>
            </select>
            <input
              type="number"
              step="0.1"
              placeholder="MTOW (kg)"
              value={mtowKg}
              onChange={(e) => setMtowKg(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Carga Paga (kg)"
              value={payloadKg}
              onChange={(e) => setPayloadKg(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="number"
              step="0.1"
              placeholder="CG (% MAC)"
              value={cgPercent}
              onChange={(e) => setCgPercent(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>

          <input
            type="url"
            placeholder="Link do CAD / Planilha de Massas congelada (Drive/Teams)"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
          <textarea
            rows={2}
            placeholder="Mudanças principais, premissas e aprovações desta revisão..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
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
              className="rounded-md bg-teal-500 px-3 py-1 text-xs font-semibold text-zinc-950"
            >
              Salvar Revisão
            </button>
          </div>
        </form>
      )}

      {seasonRevs.length === 0 ? (
        <div className="zeus-card rounded-xl p-8 text-center text-xs text-[var(--ink-subtle)]">
          Nenhuma revisão registrada para ZEUS {state.activeSeason} ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {seasonRevs.map((rev) => {
            const st = REV_STATUS_META[rev.status];
            const ratio =
              rev.mtowKg && rev.payloadKg && rev.mtowKg > 0
                ? Math.round((rev.payloadKg / rev.mtowKg) * 100)
                : null;

            return (
              <div
                key={rev.id}
                className="zeus-card rounded-xl p-4 space-y-3 border-[1.5px]"
                style={buildTintedCardStyle(
                  rev.status === "competition"
                    ? "#f59e0b"
                    : rev.status === "frozen"
                    ? "#2dd4bf"
                    : "#71717a",
                  {
                    active: rev.status === "competition",
                    emphasis: rev.status === "draft" ? "subtle" : "medium",
                  }
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-teal-500/15 border border-teal-500/40 px-2 py-0.5 font-mono text-xs font-bold text-teal-300">
                        {rev.versionTag}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${st.badgeClass}`}>
                        {rev.status !== "draft" && <Lock className="h-2.5 w-2.5" />}
                        {st.label}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--ink-subtle)]">
                        {CONCEPT_LABEL[rev.concept]} · {rev.createdAt}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold">{rev.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateAircraftRevisionStatus(rev.id, st.next)}
                          className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] hover:border-teal-500/50"
                        >
                          Avançar status
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAircraftRevision(rev.id)}
                          className="text-[var(--ink-subtle)] hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5">
                    <div className="text-[10px] text-[var(--ink-subtle)]">MTOW</div>
                    <div className="font-mono text-sm font-semibold">
                      {rev.mtowKg !== undefined ? `${rev.mtowKg} kg` : "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5">
                    <div className="text-[10px] text-[var(--ink-subtle)]">Carga Paga</div>
                    <div className="font-mono text-sm font-semibold text-emerald-400">
                      {rev.payloadKg !== undefined ? `${rev.payloadKg} kg` : "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5">
                    <div className="text-[10px] text-[var(--ink-subtle)]">Fração Carga/MTOW</div>
                    <div className="font-mono text-sm font-semibold text-amber-400">
                      {ratio !== null ? `${ratio}%` : "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5">
                    <div className="text-[10px] text-[var(--ink-subtle)]">CG (% MAC)</div>
                    <div className="font-mono text-sm font-semibold text-sky-400">
                      {rev.cgPercent !== undefined ? `${rev.cgPercent}%` : "—"}
                    </div>
                  </div>
                </div>

                {rev.notes && (
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{rev.notes}</p>
                )}

                {rev.externalUrl && (
                  <a
                    href={rev.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                  >
                    Abrir CAD / Documentação congelada <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
