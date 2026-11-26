"use client";

import React, { useState } from "react";
import { Clock, LogOut, Plus, RefreshCw, ShieldAlert, Trash2, Zap } from "lucide-react";
import { AREA_ROLE_META, getAreaMeta, ZEUS_AREAS } from "@/lib/domain";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useZeus } from "@/lib/store";
import type { AreaMembership, AreaRole, Role } from "@/lib/types";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    authLoading,
    sessionUser,
    needsOnboarding,
    authError,
    refreshRemote,
    signOut,
    completeOnboarding,
  } = useZeus();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Multi-area membership builder (choose Area first -> choose Role in that Area)
  const [selectedAreaId, setSelectedAreaId] = useState<string>("aerodinamica");
  const [selectedAreaRole, setSelectedAreaRole] = useState<AreaRole>("calouro");
  const [areaMemberships, setAreaMemberships] = useState<AreaMembership[]>([
    { areaId: "aerodinamica", role: "calouro" },
  ]);
  const [globalLeadership, setGlobalLeadership] = useState<"none" | "cocapitao" | "capitao" | "desenvolvedor">("none");

  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured || !supabase) {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--canvas)] text-[var(--ink)]">
        <div className="flex items-center gap-2.5 text-sm text-[var(--ink-subtle)]">
          <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
          Conectando à Equipe Zeus AeroDesign...
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setBusy(true);
    setLocalMsg(null);
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setLocalMsg(error.message);
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    setLocalMsg(null);

    if (mode === "login") {
      const { error } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setLocalMsg(error.message);
    } else {
      const { data, error } = await supabase!.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) {
        setLocalMsg(error.message);
      } else if (!data.session) {
        setLocalMsg("Cadastro criado! Confirme o link enviado ao seu e-mail para entrar.");
      }
    }
    setBusy(false);
  };

  const handleAddMembership = () => {
    setAreaMemberships((prev) => {
      const exists = prev.some((m) => m.areaId === selectedAreaId);
      if (exists) {
        return prev.map((m) =>
          m.areaId === selectedAreaId ? { areaId: selectedAreaId, role: selectedAreaRole } : m
        );
      }
      return [...prev, { areaId: selectedAreaId, role: selectedAreaRole }];
    });
  };

  const deriveRequestedRole = (): Role => {
    if (globalLeadership !== "none") return globalLeadership;
    if (areaMemberships.some((m) => m.role === "diretor")) return "diretor";
    if (areaMemberships.some((m) => m.role === "efetivado")) return "efetivado";
    return "calouro";
  };

  if (!sessionUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)] text-[var(--ink)]">
        <div className="zeus-card zeus-tab-enter w-full max-w-md rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0f172a] border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Zap className="h-5 w-5 fill-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Zeus AeroDesign</h1>
              <p className="text-xs text-[var(--ink-subtle)]">
                UEMA · Plataforma de Sprints & SAE Brasil
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleGoogleLogin}
            className="zeus-btn w-full h-10 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] hover:border-blue-500/60 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Continuar com Google
          </button>

          <div className="flex items-center gap-2 text-[11px] text-[var(--ink-subtle)]">
            <span className="h-px flex-1 bg-[var(--hairline)]" />
            ou use e-mail e senha
            <span className="h-px flex-1 bg-[var(--hairline)]" />
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-[var(--surface-2)] p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-1.5 rounded-md font-medium ${
                mode === "login" ? "bg-[var(--surface-1)] text-[var(--ink)]" : "text-[var(--ink-subtle)]"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-1.5 rounded-md font-medium ${
                mode === "signup" ? "bg-[var(--surface-1)] text-[var(--ink)]" : "text-[var(--ink-subtle)]"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 text-xs"
              />
            )}
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 text-xs"
            />
            <input
              type="password"
              placeholder="Senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 text-xs"
            />
            {(localMsg || authError) && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                {localMsg || authError}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="zeus-btn w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white disabled:opacity-50"
            >
              {mode === "login" ? "Entrar na plataforma" : "Cadastrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    const defaultName =
      String(sessionUser.user_metadata?.full_name ?? sessionUser.email ?? "").split("@")[0];
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)] text-[var(--ink)]">
        <div className="zeus-card zeus-tab-enter w-full max-w-xl rounded-2xl p-6 space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Complete seu cadastro na Zeus</h1>
            <p className="text-xs text-[var(--ink-subtle)] mt-1">
              Escolha primeiro a <strong>área</strong> e depois a sua <strong>função nela</strong> (ex.: Diretor em uma área e Efetivado em outra). Você pode adicionar quantos vínculos quiser.
            </p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              await completeOnboarding({
                fullName: fullName.trim() || defaultName,
                requestedRole: deriveRequestedRole(),
                areaMemberships,
              });
              setBusy(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-[11px] text-[var(--ink-subtle)] mb-1">Nome completo</label>
              <input
                type="text"
                placeholder={defaultName || "Seu nome completo"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 text-xs"
              />
            </div>

            {/* Step 1 -> Area, Step 2 -> Role in that Area */}
            <div className="rounded-xl border border-[var(--hairline-strong)] bg-[var(--surface-2)]/60 p-3.5 space-y-3">
              <div className="text-xs font-semibold">Vínculos por Área (Área → Função)</div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="sm:col-span-5 h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 text-xs"
                >
                  <optgroup label="Áreas Técnicas (8)">
                    {ZEUS_AREAS.filter((a) => a.category === "technical").map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.shortCode} · {a.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Corporativo / Empresarial (3)">
                    {ZEUS_AREAS.filter((a) => a.category === "corporate").map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.shortCode} · {a.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <select
                  value={selectedAreaRole}
                  onChange={(e) => setSelectedAreaRole(e.target.value as AreaRole)}
                  className="sm:col-span-4 h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-1)] px-2.5 text-xs"
                >
                  <option value="calouro">Calouro na área</option>
                  <option value="efetivado">Efetivado na área</option>
                  <option value="diretor">Diretor desta área</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddMembership}
                  className="sm:col-span-3 h-9 inline-flex items-center justify-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 px-3 text-xs font-semibold text-zinc-950"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>

              <div className="space-y-1.5">
                {areaMemberships.map((m) => {
                  const area = getAreaMeta(m.areaId);
                  return (
                    <div
                      key={m.areaId}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: area.colorHex }}
                        />
                        <span className="font-mono text-[10px] text-[var(--ink-subtle)]">{area.shortCode}</span>
                        <span className="font-medium truncate">{area.name}</span>
                        <span className="text-[11px] text-amber-400 font-medium">
                          · {AREA_ROLE_META[m.role].label}
                        </span>
                      </div>
                      {areaMemberships.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAreaMemberships((prev) => prev.filter((x) => x.areaId !== m.areaId))
                          }
                          className="text-[var(--ink-subtle)] hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--ink-subtle)] mb-1">
                Cargo de liderança global (opcional)
              </label>
              <select
                value={globalLeadership}
                onChange={(e) =>
                  setGlobalLeadership(
                    e.target.value as "none" | "cocapitao" | "capitao" | "desenvolvedor"
                  )
                }
                className="w-full h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 text-xs"
              >
                <option value="none">Sem cargo global (atuar somente pelas áreas acima)</option>
                <option value="cocapitao">Co-Capitão</option>
                <option value="capitao">Capitão</option>
                <option value="desenvolvedor">Desenvolvedor</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1 text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
              <button
                type="submit"
                disabled={busy}
                className="zeus-btn rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Enviar solicitação
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentUser.accountStatus !== "approved") {
    const rejected = currentUser.accountStatus === "rejected";
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--canvas)] text-[var(--ink)]">
        <div className="zeus-card zeus-tab-enter w-full max-w-md rounded-2xl p-6 text-center space-y-4">
          {rejected ? (
            <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto" />
          ) : (
            <Clock className="h-8 w-8 text-amber-500 mx-auto" />
          )}
          <h1 className="text-base font-semibold">
            {rejected ? "Cadastro não aprovado" : "Aguardando aprovação da liderança"}
          </h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            {rejected
              ? "Converse com um Capitão ou com o Desenvolvedor da Zeus AeroDesign."
              : "Seu pedido já está na fila do Desenvolvedor e dos Capitães para confirmar sua patente e funções por área."}
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => void refreshRemote()}
              className="zeus-btn inline-flex items-center gap-1.5 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar status
            </button>
            <button
              onClick={() => void signOut()}
              className="zeus-btn inline-flex items-center gap-1.5 rounded-lg border border-[var(--hairline)] px-3 py-1.5 text-xs text-[var(--ink-subtle)]"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
