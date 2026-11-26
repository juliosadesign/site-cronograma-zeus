"use client";

import { useState } from "react";
import { CheckCircle2, Edit3, Lock, MessageSquarePlus, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { canManageArea, getAreaCardStyle, getAreaMeta, isTopLeadership } from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { FeatureRequestPriority, FeatureRequestStatus } from "@/lib/types";

const PRIORITY_META: Record<FeatureRequestPriority, { label: string; badgeClass: string }> = {
  alta: {
    label: "Alta",
    badgeClass: "border-rose-500/40 bg-rose-500/15 text-rose-300",
  },
  media: {
    label: "Média",
    badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
  baixa: {
    label: "Baixa",
    badgeClass: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300",
  },
};

const STATUS_META: Record<FeatureRequestStatus, { label: string; badgeClass: string }> = {
  pendente: {
    label: "Pendente",
    badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
  em_analise: {
    label: "Em análise",
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  },
  planejado: {
    label: "Na próxima atualização",
    badgeClass: "border-violet-500/40 bg-violet-500/15 text-violet-300",
  },
  entregue: {
    label: "Entregue",
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
};

export function AreaFeatureRequestsPanel({ areaId }: { areaId: string }) {
  const {
    state,
    currentUser,
    addAreaFeatureRequest,
    updateAreaFeatureRequest,
    deleteAreaFeatureRequest,
  } = useZeus();

  const area = getAreaMeta(areaId);
  const canAccess = canManageArea(currentUser, areaId);
  const canTriage = isTopLeadership(currentUser.role);

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<FeatureRequestPriority>("media");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editPriority, setEditPriority] = useState<FeatureRequestPriority>("media");
  const [editStatus, setEditStatus] = useState<FeatureRequestStatus>("pendente");
  const [editDevNotes, setEditDevNotes] = useState("");

  if (!canAccess) {
    return (
      <div className="zeus-card rounded-xl p-8 text-center space-y-3 border-[1.5px]">
        <Lock className="h-8 w-8 mx-auto text-amber-400" />
        <h2 className="text-base font-semibold">Espaço Exclusivo do Diretor — {area.name}</h2>
        <p className="text-xs text-[var(--ink-subtle)] max-w-md mx-auto">
          Esta aba é exclusiva para o <strong>Diretor de {area.name}</strong> (além de Capitães e
          Desenvolvedor) registrar o que a área precisa na plataforma para a próxima atualização.
        </p>
      </div>
    );
  }

  const areaRequests = state.areaFeatureRequests.filter((r) => r.areaId === areaId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addAreaFeatureRequest({
      areaId,
      title: title.trim(),
      details: details.trim(),
      priority,
    });
    setTitle("");
    setDetails("");
    setPriority("media");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Submission Form */}
      <section
        className="lg:col-span-2 zeus-card rounded-xl p-4 space-y-3 border-[1.5px] h-fit"
        style={getAreaCardStyle(areaId, { emphasis: "subtle" })}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Pedir Recurso para {area.name}
            </h2>
            <p className="text-[11px] text-[var(--ink-subtle)] mt-0.5">
              Canal direto do diretor da área para descrever gráficos, calculadoras, campos ou
              fluxos que devem entrar na próxima atualização.
            </p>
          </div>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 shrink-0">
            Exclusivo Diretor
          </span>
        </div>

        <form onSubmit={handleCreate} className="space-y-2.5">
          <label className="block space-y-1 text-xs">
            <span className="text-[11px] font-medium text-[var(--ink-muted)]">
              O que sua área precisa? *
            </span>
            <input
              type="text"
              required
              placeholder={`Ex.: Tabela de perfis / calculador específico de ${area.shortCode}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <label className="block space-y-1 text-xs">
            <span className="text-[11px] font-medium text-[var(--ink-muted)]">Prioridade</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as FeatureRequestPriority)}
              className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="alta">Alta · Essencial para a área</option>
              <option value="media">Média · Melhora bastante o fluxo</option>
              <option value="baixa">Baixa · Desejável quando possível</option>
            </select>
          </label>

          <label className="block space-y-1 text-xs">
            <span className="text-[11px] font-medium text-[var(--ink-muted)]">
              Detalhes para a próxima atualização
            </span>
            <textarea
              rows={4}
              placeholder="Explique quais dados, telas, filtros ou integrações você gostaria de ter aqui na aba da sua área..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <button
            type="submit"
            className="w-full zeus-btn inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar pedido de atualização
          </button>
        </form>
      </section>

      {/* Requests List */}
      <section className="lg:col-span-3 zeus-card rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-semibold">
              Pedidos Registrados ({areaRequests.length})
            </h3>
          </div>
          <span className="text-[11px] text-[var(--ink-subtle)]">
            Visível apenas para Direção de {area.name} e Liderança
          </span>
        </div>

        {areaRequests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--hairline-strong)] p-8 text-center space-y-1.5">
            <CheckCircle2 className="h-6 w-6 mx-auto text-[var(--ink-subtle)]" />
            <div className="text-xs font-medium text-[var(--ink-muted)]">
              Nenhum pedido cadastrado para {area.name} ainda.
            </div>
            <p className="text-[11px] text-[var(--ink-subtle)]">
              Use o formulário ao lado para listar o que você quer ver aqui na próxima versão da
              plataforma.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {areaRequests.map((req) => {
              const author = state.members.find((m) => m.id === req.authorId);
              const isEditing = editingId === req.id;
              const pMeta = PRIORITY_META[req.priority];
              const sMeta = STATUS_META[req.status];
              const canDelete = req.authorId === currentUser.id || canTriage;

              return (
                <div
                  key={req.id}
                  className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/50 p-3.5 space-y-2.5"
                >
                  {isEditing ? (
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                      />
                      <textarea
                        rows={3}
                        value={editDetails}
                        onChange={(e) => setEditDetails(e.target.value)}
                        className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as FeatureRequestPriority)}
                          className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                        >
                          <option value="alta">Prioridade: Alta</option>
                          <option value="media">Prioridade: Média</option>
                          <option value="baixa">Prioridade: Baixa</option>
                        </select>
                        {canTriage && (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as FeatureRequestStatus)}
                            className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                          >
                            <option value="pendente">Status: Pendente</option>
                            <option value="em_analise">Status: Em análise</option>
                            <option value="planejado">Status: Na próxima atualização</option>
                            <option value="entregue">Status: Entregue</option>
                          </select>
                        )}
                      </div>
                      {canTriage && (
                        <input
                          type="text"
                          placeholder="Resposta / nota técnica do Desenvolvedor ou Capitão..."
                          value={editDevNotes}
                          onChange={(e) => setEditDevNotes(e.target.value)}
                          className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                        />
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-md border border-[var(--hairline)] px-2.5 py-1 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateAreaFeatureRequest(req.id, {
                              title: editTitle.trim() || req.title,
                              details: editDetails.trim(),
                              priority: editPriority,
                              ...(canTriage
                                ? { status: editStatus, devNotes: editDevNotes.trim() }
                                : {}),
                            });
                            setEditingId(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                        >
                          <Save className="h-3 w-3" /> Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sMeta.badgeClass}`}
                            >
                              {sMeta.label}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${pMeta.badgeClass}`}
                            >
                              Prioridade {pMeta.label}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-[var(--ink)]">{req.title}</h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(req.id);
                              setEditTitle(req.title);
                              setEditDetails(req.details);
                              setEditPriority(req.priority);
                              setEditStatus(req.status);
                              setEditDevNotes(req.devNotes);
                            }}
                            title="Editar pedido"
                            className="h-7 w-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-1)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-sky-400"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => deleteAreaFeatureRequest(req.id)}
                              title="Excluir pedido"
                              className="h-7 w-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-1)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {req.details && (
                        <p className="text-xs text-[var(--ink-muted)] leading-relaxed whitespace-pre-line">
                          {req.details}
                        </p>
                      )}

                      {req.devNotes && (
                        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] text-sky-200">
                          <strong>Retorno Dev/Capitania:</strong> {req.devNotes}
                        </div>
                      )}

                      <div className="text-[10px] text-[var(--ink-subtle)] flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span>
                          Solicitado por <strong>{author?.fullName ?? "Diretor"}</strong> ·{" "}
                          {req.updatedAt}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
