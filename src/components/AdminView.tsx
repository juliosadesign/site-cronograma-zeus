"use client";

import { useState } from "react";
import { Bell, Check, Send, UserPlus, X } from "lucide-react";
import { canApproveAccounts, ROLE_META, ZEUS_AREAS } from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { Member, Role } from "@/lib/types";
import { RoleBadge } from "./Badge";

function PendingReviewCard({ member }: { member: Member }) {
  const { reviewMemberAccount } = useZeus();
  const [role, setRole] = useState<Role>(member.requestedRole);
  const [areaIds, setAreaIds] = useState<string[]>(member.areaIds);
  const [directorAreaIds, setDirectorAreaIds] = useState<string[]>(member.directorAreaIds);

  const toggleArea = (id: string) => {
    setAreaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleDirectorArea = (id: string) => {
    setDirectorAreaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="rounded-md border border-amber-500/35 bg-[var(--surface-2)]/60 p-3.5 space-y-3">
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
              Patente final: {ROLE_META[r].label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-[11px] text-[var(--ink-subtle)] mb-1">Áreas liberadas (múltiplas):</div>
        <div className="flex flex-wrap gap-1">
          {ZEUS_AREAS.map((a) => {
            const active = areaIds.includes(a.id);
            return (
              <button
                type="button"
                key={a.id}
                onClick={() => toggleArea(a.id)}
                className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                  active
                    ? "border-amber-500 bg-amber-500/15 text-amber-500"
                    : "border-[var(--hairline)] text-[var(--ink-subtle)]"
                }`}
              >
                {a.shortCode}
              </button>
            );
          })}
        </div>
      </div>

      {role === "diretor" && (
        <div>
          <div className="text-[11px] text-[var(--ink-subtle)] mb-1">Diretor de qual(is) área(s):</div>
          <div className="flex flex-wrap gap-1">
            {ZEUS_AREAS.filter((a) => areaIds.includes(a.id)).map((a) => {
              const active = directorAreaIds.includes(a.id);
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => toggleDirectorArea(a.id)}
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                    active
                      ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                      : "border-[var(--hairline)] text-[var(--ink-subtle)]"
                  }`}
                >
                  {a.shortCode}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() =>
            reviewMemberAccount({
              memberId: member.id,
              approved: false,
              role,
              areaIds,
              directorAreaIds,
            })
          }
          className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10"
        >
          <X className="h-3.5 w-3.5" /> Recusar
        </button>
        <button
          onClick={() =>
            reviewMemberAccount({
              memberId: member.id,
              approved: true,
              role,
              areaIds: areaIds.length ? areaIds : ["aerodinamica"],
              directorAreaIds,
            })
          }
          className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
        >
          <Check className="h-3.5 w-3.5" /> Aprovar membro
        </button>
      </div>
    </div>
  );
}

export function AdminView() {
  const { state, currentUser, simulateSignup, reviewMemberAccount, updateNotificationConfig } =
    useZeus();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [requestedRole, setRequestedRole] = useState<Role>("calouro");
  const [signupAreas, setSignupAreas] = useState<string[]>(["aerodinamica"]);
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

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    simulateSignup({
      fullName: fullName.trim(),
      email: email.trim(),
      requestedRole,
      areaIds: signupAreas,
    });
    setFullName("");
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Gestão de Contas, Patentes & Áreas</h1>
        <p className="text-xs text-[var(--ink-subtle)]">
          Somente Desenvolvedor, Capitão e Co-Capitão aprovam cadastros e definem o nível de poder de cada membro.
        </p>
      </div>

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

      {/* Simulate Signup */}
      <section className="zeus-card rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-amber-500" />
          Simular Novo Cadastro (fluxo de entrada)
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
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[var(--ink-subtle)] mr-1">Áreas escolhidas ao entrar:</span>
            {ZEUS_AREAS.map((a) => {
              const active = signupAreas.includes(a.id);
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() =>
                    setSignupAreas((prev) =>
                      prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                    )
                  }
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                    active
                      ? "border-amber-500 bg-amber-500/15 text-amber-500"
                      : "border-[var(--hairline)] text-[var(--ink-subtle)]"
                  }`}
                >
                  {a.shortCode}
                </button>
              );
            })}
          </div>
          <button
            type="submit"
            className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
          >
            Enviar para fila de aprovação
          </button>
        </form>
      </section>

      {/* Approved Members Role Quick Edit */}
      <section className="zeus-card rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Membros Aprovados ({approved.length})</h2>
        <div className="divide-y divide-[var(--hairline)]">
          {approved.map((m) => (
            <div
              key={m.id}
              className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{m.fullName}</span>
                <RoleBadge role={m.role} />
              </div>
              <select
                value={m.role}
                onChange={(e) =>
                  reviewMemberAccount({
                    memberId: m.id,
                    approved: true,
                    role: e.target.value as Role,
                    areaIds: m.areaIds,
                    directorAreaIds:
                      e.target.value === "diretor"
                        ? m.directorAreaIds.length
                          ? m.directorAreaIds
                          : [m.areaIds[0] ?? "aerodinamica"]
                        : [],
                  })
                }
                className="h-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-2 text-xs"
              >
                {(Object.keys(ROLE_META) as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_META[r].label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Notifications & Bots (V2) */}
      <section className="zeus-card rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Notificações Automáticas (PWA + Discord / Telegram)
            </h2>
            <p className="text-xs text-[var(--ink-subtle)]">
              Canais oficiais gratuitos para avisar a equipe sobre sprints, validações e reuniões quinzenais sem risco ao WhatsApp.
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
            type="text"
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={sendingTest}
            onClick={async () => {
              setSendingTest(true);
              setNotifyStatus(null);
              const res = await fetch("/api/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  channel: "discord",
                  webhookUrl: state.notificationConfig.discordWebhookUrl,
                  title: "Teste Zeus AeroDesign",
                  message: "Integração de avisos da Sprint conectada com sucesso!",
                }),
              });
              const data = (await res.json()) as { ok: boolean; error?: string };
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
              const res = await fetch("/api/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  channel: "telegram",
                  botToken: state.notificationConfig.telegramBotToken,
                  chatId: state.notificationConfig.telegramChatId,
                  title: "Teste Zeus AeroDesign",
                  message: "Integração de avisos da Sprint conectada com sucesso!",
                }),
              });
              const data = (await res.json()) as { ok: boolean; error?: string };
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
