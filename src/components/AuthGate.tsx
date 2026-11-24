"use client";

import React, { useState } from "react";
import { Clock, LogOut, RefreshCw, ShieldAlert, Zap } from "lucide-react";
import { ZEUS_AREAS } from "@/lib/domain";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useZeus } from "@/lib/store";
import type { Role } from "@/lib/types";

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
  const [requestedRole, setRequestedRole] = useState<Role>("calouro");
  const [areaIds, setAreaIds] = useState<string[]>(["aerodinamica"]);
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
        <div className="zeus-card zeus-tab-enter w-full max-w-lg rounded-2xl p-6 space-y-4">
          <h1 className="text-lg font-semibold">Complete seu cadastro na Zeus</h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Escolha sua(s) área(s) de atuação. O primeiro membro cadastrado entra como Desenvolvedor; os seguintes aguardam aprovação dos Capitães.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              await completeOnboarding({
                fullName: fullName.trim() || defaultName,
                requestedRole,
                areaIds,
              });
              setBusy(false);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              placeholder={defaultName || "Seu nome completo"}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 text-xs"
            />
            <select
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as Role)}
              className="w-full h-9 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 text-xs"
            >
              <option value="calouro">Solicitar entrada como: Calouro</option>
              <option value="efetivado">Solicitar entrada como: Efetivado</option>
              <option value="diretor">Solicitar entrada como: Diretor</option>
              <option value="capitao">Solicitar entrada como: Capitão / Co-Capitão</option>
            </select>
            <div>
              <div className="text-[11px] text-[var(--ink-subtle)] mb-1.5">
                Selecione 1 ou mais áreas:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ZEUS_AREAS.map((a) => {
                  const active = areaIds.includes(a.id);
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() =>
                        setAreaIds((prev) =>
                          prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                        )
                      }
                      className={`rounded border px-2 py-1 font-mono text-[10px] ${
                        active
                          ? "border-blue-500 bg-blue-500/15 text-sky-400"
                          : "border-[var(--hairline)] text-[var(--ink-subtle)]"
                      }`}
                    >
                      {a.shortCode} · {a.name}
                    </button>
                  );
                })}
              </div>
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
              : "Seu pedido já está na fila do Desenvolvedor e dos Capitães para confirmar sua patente e áreas."}
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
