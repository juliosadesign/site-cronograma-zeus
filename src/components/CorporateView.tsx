"use client";

import { useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Lock,
  Megaphone,
  Plus,
  Target,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import {
  canAccessFinance,
  canManageGestao,
  canManageMarketing,
  computeFinanceSummary,
  getAreaMeta,
  getMemberAreaRole,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { FinancialKind, FinancialStatus, MarketingKind, MarketingStatus } from "@/lib/types";
import { AreaChip, AreaRoleBadge } from "./Badge";
import { MemberAvatar } from "./MemberAvatar";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const MKT_KIND_LABEL: Record<MarketingKind, string> = {
  post: "Publicação / Social",
  sponsor: "Patrocinador / Cota",
  event: "Evento / Feira",
  media: "Mídia Kit / Imprensa",
};

const MKT_STATUS_META: Record<MarketingStatus, { label: string; next: MarketingStatus; badgeClass: string }> = {
  planned: { label: "Planejado", next: "in_progress", badgeClass: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300" },
  in_progress: { label: "Em execução", next: "published", badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-300" },
  published: { label: "Publicado / Ativo", next: "closed", badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" },
  closed: { label: "Concluído", next: "planned", badgeClass: "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300" },
};

export function CorporateView({
  section,
  onOpenProfile,
}: {
  section: "financeiro" | "marketing" | "gestao";
  onOpenProfile: (memberId: string) => void;
}) {
  const areaMeta = getAreaMeta(section);

  return (
    <div className="space-y-5">
      {/* Corporate Executive Banner */}
      <div
        className="zeus-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderLeftWidth: "4px", borderLeftColor: areaMeta.colorHex }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: areaMeta.colorHex }}
            />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
              Divisão Corporativa / Empresarial · {areaMeta.shortCode}
            </span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{areaMeta.name}</h1>
          <p className="text-xs text-[var(--ink-subtle)]">{areaMeta.description}</p>
        </div>
        <AreaChip areaId={section} showName />
      </div>

      {section === "financeiro" && <FinanceiroModule />}
      {section === "marketing" && <MarketingModule />}
      {section === "gestao" && <GestaoModule onOpenProfile={onOpenProfile} />}
    </div>
  );
}

function FinanceiroModule() {
  const {
    state,
    currentUser,
    addFinancialTransaction,
    toggleFinancialStatus,
    deleteFinancialTransaction,
    upsertAreaBudget,
  } = useZeus();

  const [kindFilter, setKindFilter] = useState<"all" | FinancialKind>("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [showTxForm, setShowTxForm] = useState(false);

  const [kind, setKind] = useState<FinancialKind>("expense");
  const [status, setStatus] = useState<FinancialStatus>("paid");
  const [category, setCategory] = useState("Materiais & Oficina");
  const [areaId, setAreaId] = useState("estruturas");
  const [description, setDescription] = useState("");
  const [amountReais, setAmountReais] = useState("");
  const [txDate, setTxDate] = useState(`${state.activeSeason}-06-01`);
  const [receiptUrl, setReceiptUrl] = useState("");

  const [budgetAreaId, setBudgetAreaId] = useState("estruturas");
  const [budgetReais, setBudgetReais] = useState("");
  const [budgetNotes, setBudgetNotes] = useState("");

  if (!canAccessFinance(currentUser)) {
    return (
      <div className="zeus-card rounded-xl p-8 text-center space-y-3 border-lime-500/30">
        <Lock className="h-8 w-8 mx-auto text-lime-400" />
        <h2 className="text-base font-semibold">Módulo Financeiro Restrito</h2>
        <p className="text-xs text-[var(--ink-subtle)] max-w-md mx-auto">
          Somente membros vinculados à área <strong>Financeiro</strong>, Capitães, Co-Capitães e o Desenvolvedor podem visualizar fluxo de caixa, lançamentos, orçamentos e comprovantes da equipe.
        </p>
      </div>
    );
  }

  const seasonTxs = state.financialTransactions.filter(
    (t) => t.seasonYear === state.activeSeason
  );
  const summary = computeFinanceSummary(seasonTxs);

  const filteredTxs = seasonTxs.filter((t) => {
    if (kindFilter !== "all" && t.kind !== kindFilter) return false;
    if (areaFilter !== "all" && t.areaId !== areaFilter) return false;
    return true;
  });

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amountReais.replace(",", "."));
    if (!description.trim() || Number.isNaN(numeric) || numeric <= 0) return;
    addFinancialTransaction({
      seasonYear: state.activeSeason,
      kind,
      status,
      category: category.trim() || "Geral",
      areaId: areaId || undefined,
      description: description.trim(),
      amountCents: Math.round(numeric * 100),
      transactionDate: txDate,
      receiptUrl: receiptUrl.trim() || undefined,
    });
    setDescription("");
    setAmountReais("");
    setReceiptUrl("");
    setShowTxForm(false);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(budgetReais.replace(",", "."));
    if (Number.isNaN(numeric) || numeric < 0) return;
    upsertAreaBudget({
      areaId: budgetAreaId,
      seasonYear: state.activeSeason,
      plannedCents: Math.round(numeric * 100),
      notes: budgetNotes.trim(),
    });
    setBudgetReais("");
    setBudgetNotes("");
  };

  return (
    <div className="space-y-5">
      {/* Executive Finance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="zeus-card rounded-xl p-4 border-lime-500/35">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Saldo em Caixa ({state.activeSeason})</span>
            <Wallet className="h-4 w-4 text-lime-400" />
          </div>
          <div
            className={`mt-2 font-mono text-2xl font-bold ${
              summary.balanceCents >= 0 ? "text-lime-400" : "text-rose-400"
            }`}
          >
            {formatBRL(summary.balanceCents)}
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Recebido − Pago</div>
        </div>

        <div className="zeus-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Entradas Confirmadas</span>
            <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            {formatBRL(summary.incomePaidCents)}
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">
            +{formatBRL(summary.pendingIncomeCents)} a receber
          </div>
        </div>

        <div className="zeus-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Despesas Liquidadas</span>
            <ArrowDownCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-rose-400">
            {formatBRL(summary.expensePaidCents)}
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">
            {formatBRL(summary.pendingExpenseCents)} em cotações/pendentes
          </div>
        </div>

        <div className="zeus-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Movimentações</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold">{seasonTxs.length}</div>
          <div className="mt-1 text-[11px] text-[var(--ink-subtle)]">Lançamentos registrados</div>
        </div>
      </div>

      {/* Controls */}
      <div className="zeus-card rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "income", "expense"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`h-8 rounded-md border px-2.5 text-xs font-medium ${
                kindFilter === k
                  ? "border-lime-500/60 bg-lime-500/15 text-lime-300"
                  : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
              }`}
            >
              {k === "all" ? "Todas" : k === "income" ? "Entradas" : "Saídas"}
            </button>
          ))}

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
        </div>

        <button
          type="button"
          onClick={() => setShowTxForm((v) => !v)}
          className="zeus-btn inline-flex items-center gap-1.5 rounded-md bg-lime-500 hover:bg-lime-400 px-3 py-1.5 text-xs font-semibold text-zinc-950"
        >
          <Plus className="h-3.5 w-3.5" /> Novo Lançamento
        </button>
      </div>

      {showTxForm && (
        <form onSubmit={handleAddTx} className="zeus-card rounded-xl p-4 space-y-3">
          <div className="text-sm font-semibold">Registrar Entrada / Despesa</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as FinancialKind)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="expense">Saída (Despesa)</option>
              <option value="income">Entrada (Receita / Patrocínio)</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FinancialStatus)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="paid">Liquidado (Pago / Recebido)</option>
              <option value="pending">Previsto / Cotação</option>
            </select>
            <input
              type="text"
              placeholder="Valor em R$ (ex.: 450,00)"
              value={amountReais}
              onChange={(e) => setAmountReais(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              placeholder="Descrição (ex.: Compra tubos carbono)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="sm:col-span-2 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder="Categoria (ex.: Compósitos)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              <option value="">Geral da Equipe</option>
              {ZEUS_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  Centro de Custo: {a.name}
                </option>
              ))}
            </select>
            <input
              type="url"
              placeholder="Link do comprovante / NF (Drive/Teams)"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowTxForm(false)}
              className="rounded-md border border-[var(--hairline)] px-3 py-1 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-lime-500 px-3 py-1 text-xs font-semibold text-zinc-950"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      )}

      {/* Ledger + Budgets Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 zeus-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--hairline)] text-sm font-semibold">
            Livro Caixa & Comprovantes ({filteredTxs.length})
          </div>
          {filteredTxs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--ink-subtle)]">
              Nenhum lançamento financeiro nesta temporada.
            </div>
          ) : (
            <div className="divide-y divide-[var(--hairline)]">
              {filteredTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          tx.kind === "income"
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                            : "border-rose-500/40 bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {tx.kind === "income" ? "ENTRADA" : "SAÍDA"}
                      </span>
                      <span className="text-[11px] font-mono text-[var(--ink-subtle)]">
                        {tx.transactionDate} · {tx.category}
                      </span>
                      {tx.areaId && <AreaChip areaId={tx.areaId} subtle />}
                    </div>
                    <div className="text-xs font-medium">{tx.description}</div>
                    {tx.receiptUrl && (
                      <a
                        href={tx.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                      >
                        Comprovante <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleFinancialStatus(tx.id)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        tx.status === "paid"
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                          : "border-amber-500/40 bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {tx.status === "paid" ? "Liquidado" : "Pendente"}
                    </button>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        tx.kind === "income" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {tx.kind === "income" ? "+" : "-"}
                      {formatBRL(tx.amountCents)}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteFinancialTransaction(tx.id)}
                      className="text-[var(--ink-subtle)] hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Area Budgets */}
        <section className="zeus-card rounded-xl p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Orçamento por Área ({state.activeSeason})</h2>
            <p className="text-[11px] text-[var(--ink-subtle)]">
              Planejado vs realizado para cada centro de custo.
            </p>
          </div>

          <form onSubmit={handleSaveBudget} className="space-y-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-3">
            <select
              value={budgetAreaId}
              onChange={(e) => setBudgetAreaId(e.target.value)}
              className="w-full h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 text-xs"
            >
              {ZEUS_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.shortCode} · {a.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Teto R$ (ex.: 4500)"
                value={budgetReais}
                onChange={(e) => setBudgetReais(e.target.value)}
                className="flex-1 h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 text-xs"
              />
              <button
                type="submit"
                className="h-8 rounded-md bg-lime-500 px-2.5 text-xs font-semibold text-zinc-950"
              >
                Definir
              </button>
            </div>
            <input
              type="text"
              placeholder="Observação do orçamento..."
              value={budgetNotes}
              onChange={(e) => setBudgetNotes(e.target.value)}
              className="w-full h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 text-xs"
            />
          </form>

          <div className="space-y-2.5">
            {ZEUS_AREAS.map((area) => {
              const budget = state.areaBudgets.find(
                (b) => b.areaId === area.id && b.seasonYear === state.activeSeason
              );
              const spentCents = seasonTxs
                .filter((t) => t.kind === "expense" && t.areaId === area.id)
                .reduce((acc, t) => acc + t.amountCents, 0);
              if (!budget && spentCents === 0) return null;
              const planned = budget?.plannedCents ?? 0;
              const pct = planned > 0 ? Math.min(100, Math.round((spentCents / planned) * 100)) : 0;

              return (
                <div key={area.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: area.colorHex }}
                      />
                      {area.shortCode}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--ink-subtle)]">
                      {formatBRL(spentCents)} / {formatBRL(planned)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(4, pct)}%`,
                        backgroundColor: spentCents > planned && planned > 0 ? "#f43f5e" : area.colorHex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function MarketingModule() {
  const {
    state,
    currentUser,
    addMarketingCampaign,
    updateMarketingCampaignStatus,
    deleteMarketingCampaign,
  } = useZeus();

  const canEdit = canManageMarketing(currentUser);
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<MarketingKind>("post");
  const [title, setTitle] = useState("");
  const [partner, setPartner] = useState("@equipezeusma");
  const [dueDate, setDueDate] = useState(`${state.activeSeason}-06-30`);
  const [externalUrl, setExternalUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [impacted, setImpacted] = useState<string[]>([]);

  const seasonCampaigns = state.marketingCampaigns.filter(
    (c) => c.seasonYear === state.activeSeason
  );
  const sponsorsCount = seasonCampaigns.filter((c) => c.kind === "sponsor").length;
  const publishedCount = seasonCampaigns.filter(
    (c) => c.status === "published" || c.status === "closed"
  ).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addMarketingCampaign({
      seasonYear: state.activeSeason,
      kind,
      title: title.trim(),
      partnerOrChannel: partner.trim(),
      dueDate: dueDate || undefined,
      externalUrl: externalUrl.trim() || undefined,
      notes: notes.trim(),
      impactedAreaIds: impacted,
    });
    setTitle("");
    setNotes("");
    setExternalUrl("");
    setImpacted([]);
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="zeus-card rounded-xl p-4 border-fuchsia-500/35">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Ações na Temporada</span>
            <Megaphone className="h-4 w-4 text-fuchsia-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-fuchsia-400">
            {seasonCampaigns.length}
          </div>
        </div>
        <div className="zeus-card rounded-xl p-4">
          <div className="text-xs text-[var(--ink-subtle)]">Prospecções / Patrocinadores</div>
          <div className="mt-2 font-mono text-2xl font-bold">{sponsorsCount}</div>
        </div>
        <div className="zeus-card rounded-xl p-4">
          <div className="text-xs text-[var(--ink-subtle)]">Publicadas / Concluídas</div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            {publishedCount}
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="zeus-btn inline-flex items-center gap-1.5 rounded-md bg-fuchsia-500 hover:bg-fuchsia-400 px-3 py-1.5 text-xs font-semibold text-zinc-950"
          >
            <Plus className="h-3.5 w-3.5" /> Nova Campanha / Patrocínio
          </button>
        </div>
      )}

      {showForm && canEdit && (
        <form onSubmit={handleSubmit} className="zeus-card rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as MarketingKind)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            >
              {(Object.keys(MKT_KIND_LABEL) as MarketingKind[]).map((k) => (
                <option key={k} value={k}>
                  {MKT_KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Título da ação..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              placeholder="Canal ou parceiro (ex.: @equipezeusma)"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="url"
              placeholder="Link de arte / mídia kit / proposta"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Briefing, escopo ou entrega..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
          <div className="flex flex-wrap gap-1">
            {ZEUS_AREAS.filter((a) => a.id !== "marketing").map((a) => {
              const active = impacted.includes(a.id);
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() =>
                    setImpacted((prev) =>
                      prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                    )
                  }
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                    active
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-300"
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
              className="rounded-md bg-fuchsia-500 px-3 py-1 text-xs font-semibold text-zinc-950"
            >
              Salvar Ação
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {seasonCampaigns.map((c) => {
          const st = MKT_STATUS_META[c.status];
          return (
            <div key={c.id} className="zeus-card rounded-xl p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded border border-fuchsia-500/40 bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-300">
                    {MKT_KIND_LABEL[c.kind]}
                  </span>
                  {c.dueDate && (
                    <span className="font-mono text-[10px] text-[var(--ink-subtle)]">
                      {c.dueDate}
                    </span>
                  )}
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => deleteMarketingCampaign(c.id)}
                    className="text-[var(--ink-subtle)] hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="text-sm font-semibold">{c.title}</div>
              {c.partnerOrChannel && (
                <div className="text-xs text-fuchsia-300/90">{c.partnerOrChannel}</div>
              )}
              {c.notes && (
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{c.notes}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--hairline)]">
                <div className="flex flex-wrap gap-1">
                  {c.impactedAreaIds.map((id) => (
                    <AreaChip key={id} areaId={id} subtle />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {c.externalUrl && (
                    <a
                      href={c.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                    >
                      Material <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => updateMarketingCampaignStatus(c.id, st.next)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium disabled:opacity-60 ${st.badgeClass}`}
                  >
                    {st.label}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GestaoModule({ onOpenProfile }: { onOpenProfile: (memberId: string) => void }) {
  const { state, currentUser, addTeamOKR, updateTeamOKRProgress, deleteTeamOKR } = useZeus();
  const canEdit = canManageGestao(currentUser);

  const [showForm, setShowForm] = useState(false);
  const [quarter, setQuarter] = useState("Q2");
  const [areaId, setAreaId] = useState("gestao");
  const [title, setTitle] = useState("");
  const [keyResult, setKeyResult] = useState("");
  const [ownerId, setOwnerId] = useState(currentUser.id);

  const seasonOKRs = state.teamOKRs.filter((o) => o.seasonYear === state.activeSeason);
  const avgProgress =
    seasonOKRs.length === 0
      ? 0
      : Math.round(seasonOKRs.reduce((sum, o) => sum + o.progress, 0) / seasonOKRs.length);
  const approvedMembers = state.members.filter((m) => m.accountStatus === "approved");

  const handleAddOKR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTeamOKR({
      seasonYear: state.activeSeason,
      quarter,
      areaId: areaId || undefined,
      title: title.trim(),
      keyResult: keyResult.trim(),
      ownerId: ownerId || undefined,
    });
    setTitle("");
    setKeyResult("");
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="zeus-card rounded-xl p-4 border-blue-500/35">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>OKRs Ativos ({state.activeSeason})</span>
            <Target className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-blue-400">{seasonOKRs.length}</div>
        </div>
        <div className="zeus-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Progresso Médio das Metas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">{avgProgress}%</div>
        </div>
        <div className="zeus-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
            <span>Membros Ativos</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold">{approvedMembers.length}</div>
        </div>
      </div>

      {/* OKRs */}
      <section className="zeus-card rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" />
              Objetivos & Resultados-Chave (OKRs)
            </h2>
            <p className="text-[11px] text-[var(--ink-subtle)]">
              Metas estratégicas da temporada e acompanhamento trimestral.
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="zeus-btn inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Novo OKR
            </button>
          )}
        </div>

        {showForm && canEdit && (
          <form onSubmit={handleAddOKR} className="zeus-surface-2 rounded-lg p-3 border border-[var(--hairline)] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1.5 text-xs"
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1.5 text-xs"
              >
                {ZEUS_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.shortCode} · {a.name}
                  </option>
                ))}
              </select>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="sm:col-span-2 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1.5 text-xs"
              >
                {approvedMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dono: {m.fullName}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Objetivo (ex.: Fechar patrocinadores e congelar Rev 1.0)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder="Resultado-chave mensurável..."
              value={keyResult}
              onChange={(e) => setKeyResult(e.target.value)}
              className="w-full rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
              >
                Salvar OKR
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {seasonOKRs.map((okr) => {
            const owner = state.members.find((m) => m.id === okr.ownerId);
            return (
              <div
                key={okr.id}
                className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/60 p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-blue-500/20 border border-blue-500/40 px-1.5 py-0.5 font-mono text-[10px] text-blue-300">
                      {okr.quarter}
                    </span>
                    {okr.areaId && <AreaChip areaId={okr.areaId} />}
                    {owner && (
                      <span className="text-[11px] text-[var(--ink-subtle)]">
                        · {owner.fullName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-400">
                      {okr.progress}%
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => deleteTeamOKR(okr.id)}
                        className="text-[var(--ink-subtle)] hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs font-semibold">{okr.title}</div>
                {okr.keyResult && (
                  <div className="text-[11px] text-[var(--ink-muted)]">{okr.keyResult}</div>
                )}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={!canEdit}
                  value={okr.progress}
                  onChange={(e) => updateTeamOKRProgress(okr.id, Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer disabled:cursor-default"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Allocation Matrix across all 11 areas */}
      <section className="zeus-card rounded-xl p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Matriz de Alocação das 11 Áreas</h2>
          <p className="text-[11px] text-[var(--ink-subtle)]">
            Visão de diretores, efetivados e calouros distribuídos por área.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {ZEUS_AREAS.map((area) => {
            const members = approvedMembers.filter(
              (m) => m.areaIds.includes(area.id) || m.areaMemberships?.some((am) => am.areaId === area.id)
            );
            return (
              <div
                key={area.id}
                className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/50 p-3 space-y-2"
                style={{ borderLeftWidth: "3px", borderLeftColor: area.colorHex }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: area.colorHex }}
                    />
                    {area.shortCode} · {area.name}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--ink-subtle)]">
                    {members.length} membro(s)
                  </span>
                </div>
                {members.length === 0 ? (
                  <div className="text-[11px] text-[var(--ink-subtle)]">Sem membros alocados.</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => {
                      const areaRole = getMemberAreaRole(m, area.id) ?? "efetivado";
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onOpenProfile(m.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-1)] px-2 py-1 text-[11px] hover:border-[var(--hairline-strong)]"
                        >
                          <MemberAvatar member={m} size="sm" />
                          <span>{m.fullName}</span>
                          <AreaRoleBadge role={areaRole} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
