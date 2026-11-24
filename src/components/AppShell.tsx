"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  CalendarCheck2,
  FolderLock,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  Trophy,
  Zap,
} from "lucide-react";
import { canApproveAccounts, ROLE_META } from "@/lib/domain";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useZeus } from "@/lib/store";
import { RoleBadge } from "./Badge";
import { MemberAvatar } from "./MemberAvatar";

export type NavTab =
  | "dashboard"
  | "sprints"
  | "areas"
  | "calendar"
  | "ranking"
  | "meetings"
  | "admin";

const THEME_KEY = "zeus_theme";

export function AppShell({
  activeTab,
  onTabChange,
  onOpenProfile,
  children,
}: {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenProfile: (memberId: string) => void;
  children: React.ReactNode;
}) {
  const { state, currentUser, switchUser, resetDemo, toggleMyLabPresence } = useZeus();
  const [dark, setDark] = useState(true);
  const [quickJump, setQuickJump] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const pendingCount = state.members.filter((m) => m.accountStatus === "pending").length;
  const isAdmin = canApproveAccounts(currentUser);

  const platformNav: Array<{
    id: NavTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "dashboard", label: "Visão Geral", shortLabel: "Início", icon: LayoutDashboard },
    { id: "sprints", label: "Sprints", shortLabel: "Sprints", icon: ListChecks },
    { id: "areas", label: "Áreas & Relatórios", shortLabel: "Áreas", icon: FolderLock },
    { id: "calendar", label: "Calendário", shortLabel: "Agenda", icon: Calendar },
    { id: "ranking", label: "Ranking & Perfis", shortLabel: "Ranking", icon: Trophy },
    { id: "meetings", label: "Reuniões", shortLabel: "Chamada", icon: CalendarCheck2 },
  ];

  const managementNav = isAdmin
    ? [
        {
          id: "admin" as const,
          label: "Gestão & Contas",
          shortLabel: "Gestão",
          icon: ShieldCheck,
          badge: pendingCount || undefined,
        },
      ]
    : [];

  const allNav = [...platformNav, ...managementNav];
  const filteredPlatformNav = quickJump.trim()
    ? platformNav.filter((i) => i.label.toLowerCase().includes(quickJump.toLowerCase()))
    : platformNav;
  const filteredMgmtNav = quickJump.trim()
    ? managementNav.filter((i) => i.label.toLowerCase().includes(quickJump.toLowerCase()))
    : managementNav;

  const approvedMembers = state.members.filter((m) => m.accountStatus === "approved");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--canvas)] text-[var(--ink)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-[var(--hairline)] bg-[var(--surface-1)]">
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-[var(--hairline)]">
          <div className="h-7 w-7 rounded-lg bg-[#0f172a] border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Zap className="h-4 w-4 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight truncate">Zeus AeroDesign</div>
            <div className="text-[11px] text-[var(--ink-subtle)] truncate">UEMA · SAE Brasil SJC</div>
          </div>
        </div>

        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[var(--ink-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickJump}
              onChange={(e) => setQuickJump(e.target.value)}
              placeholder="Buscar aba..."
              className="w-full h-8 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] pl-8 pr-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:outline-none focus:border-blue-500/60"
            />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
              Plataforma
            </div>
            {filteredPlatformNav.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`zeus-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium border ${
                    active
                      ? "zeus-nav-active text-[var(--ink)]"
                      : "text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]/70 border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? "text-blue-500" : ""}`} />
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredMgmtNav.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
                Liderança
              </div>
              {filteredMgmtNav.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`zeus-btn w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium border ${
                      active
                        ? "zeus-nav-active text-[var(--ink)]"
                        : "text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]/70 border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${active ? "text-blue-500" : ""}`} />
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 font-mono text-[10px]">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-[var(--hairline)] space-y-2.5">
          <button
            onClick={() => onOpenProfile(currentUser.id)}
            className="w-full text-left rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] hover:border-[var(--hairline-strong)] p-2.5 flex items-center gap-2.5 transition-colors"
          >
            <MemberAvatar member={currentUser} size="md" />
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{currentUser.fullName}</div>
              <div className="mt-1">
                <RoleBadge role={currentUser.role} />
              </div>
            </div>
          </button>
          <div className="text-[11px] text-[var(--ink-subtle)] flex items-center justify-between px-1">
            <span>{isSupabaseConfigured ? "Supabase ativo" : "Modo Local / Demo"}</span>
            {!isSupabaseConfigured && (
              <button
                onClick={resetDemo}
                title="Resetar dados de demonstração"
                className="inline-flex items-center gap-1 text-sky-400 hover:text-amber-400 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-8">
        <header className="sticky top-0 z-20 h-14 border-b border-[var(--hairline)] bg-[var(--surface-1)]/90 backdrop-blur px-4 md:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:hidden">
            <div className="h-7 w-7 rounded-lg bg-[#0f172a] border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Zeus Aero</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-[var(--ink-subtle)]">
            <span className="font-mono text-sky-400">ZEUS 2026</span>
            <span>/</span>
            <span className="text-[var(--ink)] font-medium">
              {allNav.find((i) => i.id === activeTab)?.label ?? "Visão Geral"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMyLabPresence}
              title="Marcar se você está na sala do laboratório agora"
              className={`zeus-btn h-8 rounded-md border px-2.5 text-xs font-medium inline-flex items-center gap-1.5 ${
                currentUser.inLabNow
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {currentUser.inLabNow ? "Na sala" : "Fora da sala"}
              </span>
            </button>

            {!isSupabaseConfigured && (
              <label className="flex items-center gap-1.5 text-xs">
                <span className="hidden lg:inline text-[var(--ink-subtle)]">Testar como:</span>
                <select
                  aria-label="Selecionar usuário de demonstração"
                  value={currentUser.id}
                  onChange={(e) => {
                    switchUser(e.target.value);
                    const nextUser = state.members.find((m) => m.id === e.target.value);
                    if (activeTab === "admin" && nextUser && !canApproveAccounts(nextUser)) {
                      onTabChange("dashboard");
                    }
                  }}
                  className="h-8 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {approvedMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({ROLE_META[m.role].label})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              onClick={toggleTheme}
              aria-label="Alternar tema claro e escuro"
              className="h-8 w-8 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-muted)] hover:text-amber-400 transition-colors"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-5 max-w-6xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile PWA Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--hairline)] bg-[var(--surface-1)]/95 backdrop-blur flex justify-around px-1 py-1.5">
        {allNav.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium ${
                active ? "text-blue-500" : "text-[var(--ink-subtle)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.shortLabel}</span>
              {item.badge ? (
                <span className="absolute -top-0.5 right-1 h-3.5 min-w-3.5 rounded-full bg-amber-500 text-black px-1 text-[9px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
