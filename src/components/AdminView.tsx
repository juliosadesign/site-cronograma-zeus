"use client";

import { useState } from "react";
import { Bell, Check, Edit3, Ghost, Link2, Plus, Save, Send, Trash2, Unlink, UserPlus, X } from "lucide-react";
import {
  AREA_ROLE_META,
  canApproveAccounts,
  getAreaMeta,
  ROLE_META,
  ZEUS_AREAS,
} from "@/lib/domain";
import { GHOST_TEAM_ROSTER, getUnallocatedGhosts } from "@/lib/ghost-members";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useZeus } from "@/lib/store";
import type { AreaMembership, AreaRole, Member, Role } from "@/lib/types";
import { AreaRoleBadge, RoleBadge } from "./Badge";

function MembershipEditor({
  memberships,
  onChange,
}: {
  memberships: AreaMembership[];
  onChange: (next: AreaMembership[]) => void;
}) {
  const [areaId, setAreaId] = useState("aerodinamica");
  const [role, setRole] = useState<AreaRole>("efetivado");

  const addOrUpdate = () => {
    const exists = memberships.some((m) => m.areaId === areaId);
    if (exists) {
      onChange(memberships.map((m) => (m.areaId === areaId ? { areaId, role } : m)));
    } else {
      onChange([...memberships, { areaId, role }]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5">
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="sm:col-span-5 h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 text-xs"
        >
          {ZEUS_AREAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.shortCode} · {a.name}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AreaRole)}
          className="sm:col-span-4 h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 text-xs"
        >
          <option value="calouro">Calouro</option>
          <option value="efetivado">Efetivado</option>
          <option value="diretor">Diretor da Área</option>
        </select>
        <button
          type="button"
          onClick={addOrUpdate}
          className="sm:col-span-3 h-8 inline-flex items-center justify-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/25"
        >
          <Plus className="h-3 w-3" /> Vincular
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {memberships.map((m) => {
          const area = getAreaMeta(m.areaId);
          return (
            <span
              key={m.areaId}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 py-1 text-[11px]"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: area.colorHex }}
              />
              <span className="font-mono text-[10px]">{area.shortCode}</span>
              <select
                value={m.role}
                onChange={(e) =>
                  onChange(
                    memberships.map((item) =>
                      item.areaId === m.areaId ? { ...item, role: e.target.value as AreaRole } : item
                    )
                  )
                }
                className="bg-transparent text-[11px] font-medium focus:outline-none"
              >
                <option value="calouro" className="bg-zinc-900">Calouro</option>
                <option value="efetivado" className="bg-zinc-900">Efetivado</option>
                <option value="diretor" className="bg-zinc-900">Diretor</option>
              </select>
              {memberships.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(memberships.filter((x) => x.areaId !== m.areaId))}
                  className="text-[var(--ink-subtle)] hover:text-rose-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function getInitialMemberships(member: Member): AreaMembership[] {
  if (member.areaMemberships && member.areaMemberships.length > 0) {
    return member.areaMemberships;
  }
  if (member.areaIds.length > 0) {
    return member.areaIds.map((areaId) => ({
      areaId,
      role: member.directorAreaIds.includes(areaId)
        ? "diretor"
        : member.role === "calouro"
        ? "calouro"
        : "efetivado",
    }));
  }
  return [{ areaId: "aerodinamica", role: "calouro" }];
}

function PendingReviewCard({ member }: { member: Member }) {
  const { state, reviewMemberAccount, allocateGhostToMember } = useZeus();
  const [role, setRole] = useState<Role>(member.requestedRole);
  const [memberships, setMemberships] = useState<AreaMembership[]>(() =>
    getInitialMemberships(member)
  );
  const availableGhosts = getUnallocatedGhosts(state.members, state.ghostAllocations);
  const [selectedGhostId, setSelectedGhostId] = useState<string>("");

  return (
    <div className="rounded-lg border border-amber-500/35 bg-[var(--surface-2)]/60 p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{member.fullName}</div>
          <div className="text-xs text-[var(--ink-subtle)]">
            {member.email} · Solicitou: {ROLE_META[member.requestedRole].label}
          </div>
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2 text-xs"
        >
          {(Object.keys(ROLE_META) as Role[]).map((r) => (
            <option key={r} value={r}>
              Patente global: {ROLE_META[r].label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-[11px] text-[var(--ink-subtle)] mb-1.5">
          Áreas e função em cada área:
        </div>
        <MembershipEditor memberships={memberships} onChange={setMemberships} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--hairline)]">
        {availableGhosts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="Selecionar perfil fantasma para aprovar e alocar"
              value={selectedGhostId}
              onChange={(e) => setSelectedGhostId(e.target.value)}
              className="h-7 rounded-md border border-violet-500/40 bg-[var(--surface-1)] px-2 text-[11px]"
            >
              <option value="">Alocar perfil fantasma (opcional)...</option>
              {availableGhosts.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName}
                </option>
              ))}
            </select>
            {selectedGhostId && (
              <button
                type="button"
                onClick={() => {
                  allocateGhostToMember(selectedGhostId, member.id);
                  setSelectedGhostId("");
                }}
                className="inline-flex items-center gap-1 rounded-md bg-violet-600 hover:bg-violet-500 px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                <Link2 className="h-3 w-3" /> Aprovar & Alocar Fantasma
              </button>
            )}
          </div>
        ) : (
          <span />
        )}
        <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() =>
            reviewMemberAccount({
              memberId: member.id,
              approved: false,
              role,
              areaMemberships: memberships,
            })
          }
          className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10"
        >
          <X className="h-3.5 w-3.5" /> Recusar
        </button>
        <button
          type="button"
          onClick={() =>
            reviewMemberAccount({
              memberId: member.id,
              approved: true,
              role,
              areaMemberships: memberships.length
                ? memberships
                : [{ areaId: "aerodinamica", role: "calouro" }],
            })
          }
          className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          <Check className="h-3.5 w-3.5" /> Aprovar membro
        </button>
        </div>
      </div>
    </div>
  );
}

function ApprovedMemberRow({ member }: { member: Member }) {
  const { state, reviewMemberAccount, allocateGhostToMember, unallocateGhost } = useZeus();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<Role>(member.role);
  const [memberships, setMemberships] = useState<AreaMembership[]>(() =>
    getInitialMemberships(member)
  );
  const [ghostPick, setGhostPick] = useState("");
  const allocatedEntries = Object.entries(state.ghostAllocations ?? {}).filter(
    ([, profileId]) => profileId === member.id
  );
  const availableGhosts = getUnallocatedGhosts(state.members, state.ghostAllocations ?? {});

  return (
    <div className="py-3 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium">{member.fullName}</span>
            {(!member.isGhost || member.roleConfirmed) && <RoleBadge role={member.role} />}
            {member.isGhost && (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                <Ghost className="h-2.5 w-2.5" /> Fantasma (Apresentação)
              </span>
            )}
            {allocatedEntries.map(([gId]) => {
              const gDef = GHOST_TEAM_ROSTER.find((g) => g.id === gId);
              return (
                <span
                  key={gId}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
                >
                  <Link2 className="h-2.5 w-2.5" />
                  Fantasma alocado: {gDef?.fullName ?? gId}
                  <button
                    type="button"
                    onClick={() => unallocateGhost(gId)}
                    title="Desvincular fantasma"
                    className="ml-0.5 hover:text-rose-400"
                  >
                    <Unlink className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1">
            {member.areaIds.length > 0 ? (
              member.isGhost && !member.roleConfirmed ? (
                member.areaIds.map((areaId) => {
                  const area = getAreaMeta(areaId);
                  return (
                    <span
                      key={areaId}
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${area.chipClass}`}
                    >
                      {area.shortCode} · {area.name}
                    </span>
                  );
                })
              ) : (
                getInitialMemberships(member).map((m) => (
                  <AreaRoleBadge key={m.areaId} areaId={m.areaId} role={m.role} />
                ))
              )
            ) : (
              <span className="text-[11px] text-[var(--ink-subtle)]">
                Área ainda não vinculada nos arquivos importados
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {member.isGhost ? (
            <span className="text-[11px] text-[var(--ink-subtle)]">
              Somente visualização local
            </span>
          ) : (
            <>
              {availableGhosts.length > 0 && (
                <div className="inline-flex items-center gap-1">
                  <select
                    aria-label={`Alocar perfil fantasma para ${member.fullName}`}
                    value={ghostPick}
                    onChange={(e) => setGhostPick(e.target.value)}
                    className="h-7 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 text-[11px] max-w-[190px]"
                  >
                    <option value="">Alocar fantasma...</option>
                    {availableGhosts.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.fullName}
                      </option>
                    ))}
                  </select>
                  {ghostPick && (
                    <button
                      type="button"
                      onClick={() => {
                        allocateGhostToMember(ghostPick, member.id);
                        setGhostPick("");
                      }}
                      className="h-7 inline-flex items-center gap-1 rounded-md bg-violet-600 hover:bg-violet-500 px-2 text-[11px] font-semibold text-white"
                    >
                      <Link2 className="h-3 w-3" /> Alocar
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setRole(member.role);
                  setMemberships(getInitialMemberships(member));
                  setEditing((v) => !v);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] hover:border-blue-500/50"
              >
                <Edit3 className="h-3 w-3" /> {editing ? "Fechar" : "Editar vínculos"}
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)]/70 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-[var(--ink-subtle)]">
              Patente global & papéis individuais por área ({Object.values(AREA_ROLE_META).map((v) => v.label).join(" / ")}):
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-1)] px-2 text-xs"
            >
              {(Object.keys(ROLE_META) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r].label}
                </option>
              ))}
            </select>
          </div>
          <MembershipEditor memberships={memberships} onChange={setMemberships} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border border-[var(--hairline)] px-2.5 py-1 text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                reviewMemberAccount({
                  memberId: member.id,
                  approved: true,
                  role,
                  areaMemberships: memberships,
                });
                setEditing(false);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold text-white"
            >
              <Save className="h-3 w-3" /> Salvar permissões
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminView() {
  const {
    state,
    currentUser,
    ghostMembersEnabled,
    toggleGhostMembers,
    simulateSignup,
    updateNotificationConfig,
    saveNotificationConfigRemote,
    sendTestNotification,
  } = useZeus();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [requestedRole, setRequestedRole] = useState<Role>("calouro");
  const [signupMemberships, setSignupMemberships] = useState<AreaMembership[]>([
    { areaId: "aerodinamica", role: "calouro" },
  ]);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  if (!canApproveAccounts(currentUser)) {
    return (
      <div className="zeus-card rounded-lg p-6 text-sm text-[var(--ink-subtle)]">
        Acesso restrito a Desenvolvedor, Capitão e Co-Capitão.
      </div>
    );
  }

  const pending = state.members.filter((m) => m.accountStatus === "pending");
  const approved = state.members.filter((m) => m.accountStatus === "approved");
  const realApprovedCount = approved.filter((m) => !m.isGhost).length;
  const ghostCount = approved.filter((m) => m.isGhost).length;

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    simulateSignup({
      fullName: fullName.trim(),
      email: email.trim(),
      requestedRole,
      areaMemberships: signupMemberships,
    });
    setFullName("");
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Gestão de Contas, Patentes & Áreas</h1>
        <p className="text-xs text-[var(--ink-subtle)]">
          Defina patentes globais e múltiplos papéis por área (ex.: Diretor em uma área e Efetivado em outra).
        </p>
      </div>

      {/* Presentation Mode: Ghost Team Members Toggle */}
      <section className="zeus-card rounded-xl p-4 border-violet-500/35 bg-violet-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Ghost className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold">
              Modo Apresentação · Membros Fantasmas da Equipe
            </h2>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                ghostMembersEnabled
                  ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                  : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
              }`}
            >
              {ghostMembersEnabled ? `ATIVO (${ghostCount} fantasmas)` : "DESATIVADO"}
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] max-w-2xl">
            Ative para demonstrar a plataforma com os nomes reais da Equipe Zeus (Microsoft Teams e
            Presença 2026) sem gravar no Supabase. Campos sem confirmação (e-mail, curso, horários ou
            áreas não confirmadas) permanecem em branco.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleGhostMembers}
          className={`zeus-btn shrink-0 inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-semibold transition-colors ${
            ghostMembersEnabled
              ? "border-violet-400/70 bg-violet-600 hover:bg-violet-500 text-white"
              : "border-[var(--hairline-strong)] bg-[var(--surface-2)] hover:border-violet-500/50 text-[var(--ink)]"
          }`}
        >
          <Ghost className="h-3.5 w-3.5" />
          {ghostMembersEnabled ? "Desativar fantasmas" : "Ativar membros fantasmas"}
        </button>
      </section>

      {/* Pending Approvals */}
      <section className="zeus-card rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Fila de Aprovação ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <div className="text-xs text-[var(--ink-subtle)] py-3">
            Nenhuma solicitação pendente no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((m) => (
              <PendingReviewCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </section>

      {/* Simulate Signup (Local Demo Only) */}
      {!isSupabaseConfigured && (
        <section className="zeus-card rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-amber-500" />
            Simular Novo Cadastro (Modo Demo Local)
          </h2>
          <form onSubmit={handleSimulate} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="Nome completo do novo membro"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="email"
                placeholder="E-mail (@uema.br ou pessoal)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
              />
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as Role)}
                className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
              >
                <option value="calouro">Solicita: Calouro</option>
                <option value="efetivado">Solicita: Efetivado</option>
                <option value="diretor">Solicita: Diretor</option>
              </select>
            </div>
            <MembershipEditor memberships={signupMemberships} onChange={setSignupMemberships} />
            <button
              type="submit"
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
            >
              Enviar para fila de aprovação
            </button>
          </form>
        </section>
      )}

      {/* Approved Members Full Role + Multi-Area Edit */}
      <section className="zeus-card rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold">
          Membros Aprovados ({realApprovedCount} reais{ghostCount > 0 ? ` + ${ghostCount} fantasmas` : ""})
        </h2>
        <div className="divide-y divide-[var(--hairline)]">
          {approved.map((m) => (
            <ApprovedMemberRow key={m.id} member={m} />
          ))}
        </div>
      </section>

      {/* Notifications & Bots (V3 Persisted + Protected) */}
      <section className="zeus-card rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Notificações Automáticas (Discord / Telegram + Push)
            </h2>
            <p className="text-xs text-[var(--ink-subtle)]">
              Configuração salva com acesso restrito à liderança e disparada via API autenticada.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (typeof window === "undefined" || !("Notification" in window)) {
                setNotifyStatus("Este navegador não suporta notificações Push.");
                return;
              }
              const perm = await Notification.requestPermission();
              if (perm === "granted") {
                new Notification("Zeus AeroDesign", {
                  body: "Notificações Push ativadas neste dispositivo!",
                });
                setNotifyStatus("Push ativado no navegador!");
              } else {
                setNotifyStatus(`Permissão de Push: ${perm}`);
              }
            }}
            className="zeus-btn rounded-md border border-blue-500/40 bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-sky-400"
          >
            Ativar Push no App
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="url"
            placeholder="Discord Webhook URL (opcional)"
            value={state.notificationConfig.discordWebhookUrl ?? ""}
            onChange={(e) => updateNotificationConfig({ discordWebhookUrl: e.target.value })}
            className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
          <input
            type="password"
            placeholder="Telegram Bot Token (opcional)"
            value={state.notificationConfig.telegramBotToken ?? ""}
            onChange={(e) => updateNotificationConfig({ telegramBotToken: e.target.value })}
            className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
          <input
            type="text"
            placeholder="Telegram Chat ID (opcional)"
            value={state.notificationConfig.telegramChatId ?? ""}
            onChange={(e) => updateNotificationConfig({ telegramChatId: e.target.value })}
            className="rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--ink-muted)]">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={Boolean(state.notificationConfig.autoNotifyAnnouncements)}
              onChange={(e) =>
                updateNotificationConfig({ autoNotifyAnnouncements: e.target.checked })
              }
            />
            Disparar em avisos fixados
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={Boolean(state.notificationConfig.autoNotifyApprovals)}
              onChange={(e) =>
                updateNotificationConfig({ autoNotifyApprovals: e.target.checked })
              }
            />
            Disparar em aprovações na Reunião
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={Boolean(state.notificationConfig.autoNotifyBlockers)}
              onChange={(e) =>
                updateNotificationConfig({ autoNotifyBlockers: e.target.checked })
              }
            />
            Disparar em bloqueios de Sprint
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void saveNotificationConfigRemote(state.notificationConfig)}
            className="zeus-btn inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Save className="h-3 w-3" /> Salvar Config no Banco
          </button>

          <button
            type="button"
            disabled={sendingTest}
            onClick={async () => {
              setSendingTest(true);
              setNotifyStatus(null);
              const data = await sendTestNotification("discord", state.notificationConfig);
              setNotifyStatus(data.ok ? "Enviado para o Discord!" : data.error ?? "Falha no envio.");
              setSendingTest(false);
            }}
            className="zeus-btn inline-flex items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-1.5 text-xs"
          >
            <Send className="h-3 w-3" /> Testar Discord
          </button>

          <button
            type="button"
            disabled={sendingTest}
            onClick={async () => {
              setSendingTest(true);
              setNotifyStatus(null);
              const data = await sendTestNotification("telegram", state.notificationConfig);
              setNotifyStatus(data.ok ? "Enviado para o Telegram!" : data.error ?? "Falha no envio.");
              setSendingTest(false);
            }}
            className="zeus-btn inline-flex items-center gap-1 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-1.5 text-xs"
          >
            <Send className="h-3 w-3" /> Testar Telegram
          </button>

          {notifyStatus && (
            <span className="text-xs text-amber-400 font-mono">{notifyStatus}</span>
          )}
        </div>
      </section>
    </div>
  );
}
