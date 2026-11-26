"use client";

import React, { useEffect, useState } from "react";
import {
  Archive,
  Briefcase,
  Calendar,
  CalendarCheck2,
  ClipboardCheck,
  Command,
  DollarSign,
  FolderLock,
  GitCommitHorizontal,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  Trophy,
  Zap,
} from "lucide-react";
import {
  canAccessFinance,
  canApproveAccounts,
  getAreaMeta,
  ROLE_META,
} from "@/lib/domain";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useZeus } from "@/lib/store";
import type { SeasonYear } from "@/lib/types";
import { RoleBadge } from "./Badge";
import { MemberAvatar } from "./MemberAvatar";

export type NavTab =
  | "dashboard"
  | "sprints"
  | "areas"
  | "graph"
  | "revisoes"
  | "archive"
  | "flight"
  | "calendar"
  | "ranking"
  | "meetings"
  | "financeiro"
  | "marketing"
  | "gestao"
  | "admin";

const THEME_KEY = "zeus_theme";
const SIDEBAR_KEY = "zeus_sidebar_collapsed";

export function AppShell({
  activeTab,
  onTabChange,
  onOpenProfile,
  onOpenPalette,
  children,
}: {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenProfile: (memberId: string) => void;
  onOpenPalette: () => void;
  children: React.ReactNode;
}) {
  const {
    state,
    currentUser,
    switchUser,
    resetDemo,
    toggleMyLabPresence,
    signOut,
    setActiveSeason,
  } = useZeus();
  const [dark, setDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [quickJump, setQuickJump] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme ? savedTheme === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    const savedSidebar = localStorage.getItem(SIDEBAR_KEY);
    if (savedSidebar === "1") setCollapsed(true);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
  };

  const pendingCount = state.members.filter((m) => m.accountStatus === "pending").length;
  const isAdmin = canApproveAccounts(currentUser);
  const hasFinanceAccess = canAccessFinance(currentUser);

  const platformNav: Array<{
    id: NavTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "dashboard", label: "Visão Geral", shortLabel: "Início", icon: LayoutDashboard },
    { id: "sprints", label: "Sprints", shortLabel: "Sprints", icon: ListChecks },
    { id: "areas", label: "Áreas Técnicas", shortLabel: "Áreas", icon: FolderLock },
    { id: "graph", label: "Grafo Obsidian", shortLabel: "Grafo", icon: Network },
    { id: "revisoes", label: "Design Freeze", shortLabel: "Revisões", icon: GitCommitHorizontal },
    { id: "archive", label: "Acervo & Relatórios", shortLabel: "Acervo", icon: Archive },
    { id: "flight", label: "Voo & Lições SAE", shortLabel: "Voo", icon: ClipboardCheck },
    { id: "calendar", label: "Calendário", shortLabel: "Agenda", icon: Calendar },
    { id: "ranking", label: "Ranking & Perfis", shortLabel: "Ranking", icon: Trophy },
    { id: "meetings", label: "Reuniões", shortLabel: "Chamada", icon: CalendarCheck2 },
  ];

  const corporateNav: Array<{
    id: NavTab;
    areaId: string;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    locked?: boolean;
  }> = [
    {
      id: "financeiro",
      areaId: "financeiro",
      label: "Financeiro",
      shortLabel: "Fin.",
      icon: DollarSign,
      locked: !hasFinanceAccess,
    },
    {
      id: "marketing",
      areaId: "marketing",
      label: "Marketing",
      shortLabel: "Mkt",
      icon: Megaphone,
    },
    {
      id: "gestao",
      areaId: "gestao",
      label: "Gestão & OKRs",
      shortLabel: "Gestão",
      icon: Briefcase,
    },
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

  const allNav = [...platformNav, ...corporateNav, ...managementNav];
  const filteredPlatformNav = quickJump.trim()
    ? platformNav.filter((i) => i.label.toLowerCase().includes(quickJump.toLowerCase()))
    : platformNav;
  const filteredCorporateNav = quickJump.trim()
    ? corporateNav.filter((i) => i.label.toLowerCase().includes(quickJump.toLowerCase()))
    : corporateNav;
  const filteredMgmtNav = quickJump.trim()
    ? managementNav.filter((i) => i.label.toLowerCase().includes(quickJump.toLowerCase()))
    : managementNav;

  const approvedMembers = state.members.filter((m) => m.accountStatus === "approved");

  const activeNavClass =
    "bg-blue-600/20 border-blue-500/70 text-[var(--ink)] shadow-[inset_3px_0_0_0_#3b82f6]";
  const inactiveNavClass =
    "text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]/70 border-transparent";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--canvas)] text-[var(--ink)]">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 border-r border-[var(--hairline)] bg-[var(--surface-1)] transition-[width] duration-200 z-30 ${
          collapsed ? "md:w-[68px]" : "md:w-64"
        }`}
      >
        <div className="h-14 px-3 flex items-center justify-between gap-2 border-b border-[var(--hairline)]">
          <div className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "mx-auto" : ""}`}>
            <div className="h-7 w-7 rounded-lg bg-[#0f172a] border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="h-4 w-4 fill-amber-400" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight truncate">Zeus AeroDesign</div>
                <div className="text-[11px] text-[var(--ink-subtle)] truncate">UEMA · SAE Brasil SJC</div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={toggleSidebar}
              title="Retrair menu lateral"
              aria-label="Retrair menu lateral"
              className="h-7 w-7 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-blue-400 shrink-0"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="px-2 pt-2 flex justify-center">
            <button
              onClick={toggleSidebar}
              title="Expandir menu lateral"
              aria-label="Expandir menu lateral"
              className="h-8 w-full rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-subtle)] hover:text-blue-400"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[var(--ink-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickJump}
                onChange={(e) => setQuickJump(e.target.value)}
                placeholder="Filtrar menu..."
                className="w-full h-8 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] pl-8 pr-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:outline-none focus:border-blue-500/60"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 p-2.5 space-y-4 overflow-y-auto">
          {/* Group 1: Engenharia & Plataforma */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
                Engenharia & Sprints
              </div>
            )}
            {filteredPlatformNav.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  title={item.label}
                  onClick={() => onTabChange(item.id)}
                  className={`zeus-btn w-full flex items-center ${
                    collapsed ? "justify-center px-0 py-2" : "justify-between px-3 py-1.5"
                  } rounded-lg text-[13px] font-medium border ${
                    active ? activeNavClass : inactiveNavClass
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-400" : ""}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Group 2: Corporativo / Empresarial */}
          {filteredCorporateNav.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[var(--hairline)]">
              {!collapsed && (
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                  Corporativo / Empresarial
                </div>
              )}
              {filteredCorporateNav.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const meta = getAreaMeta(item.areaId);
                return (
                  <button
                    key={item.id}
                    title={item.locked ? `${item.label} (Acesso restrito)` : item.label}
                    onClick={() => onTabChange(item.id)}
                    style={
                      active
                        ? {
                            borderColor: `${meta.colorHex}aa`,
                            backgroundColor: `${meta.colorHex}1c`,
                            boxShadow: `inset 3px 0 0 0 ${meta.colorHex}`,
                          }
                        : undefined
                    }
                    className={`zeus-btn w-full flex items-center ${
                      collapsed ? "justify-center px-0 py-2" : "justify-between px-3 py-1.5"
                    } rounded-lg text-[13px] font-medium border ${
                      active ? "text-[var(--ink)]" : inactiveNavClass
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: meta.colorHex }}
                      />
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && item.locked && (
                      <Lock className="h-3 w-3 text-[var(--ink-subtle)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Group 3: Liderança */}
          {filteredMgmtNav.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[var(--hairline)]">
              {!collapsed && (
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-subtle)]">
                  Liderança
                </div>
              )}
              {filteredMgmtNav.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    title={item.label}
                    onClick={() => onTabChange(item.id)}
                    className={`zeus-btn relative w-full flex items-center ${
                      collapsed ? "justify-center px-0 py-2" : "justify-between px-3 py-1.5"
                    } rounded-lg text-[13px] font-medium border ${
                      active ? activeNavClass : inactiveNavClass
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-400" : ""}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </span>
                    {!collapsed && item.badge ? (
                      <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 font-mono text-[10px]">
                        {item.badge}
                      </span>
                    ) : null}
                    {collapsed && item.badge ? (
                      <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-amber-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-2.5 border-t border-[var(--hairline)] space-y-2">
          <button
            onClick={() => onOpenProfile(currentUser.id)}
            title={currentUser.fullName}
            className={`w-full text-left rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] hover:border-[var(--hairline-strong)] ${
              collapsed ? "p-1.5 flex justify-center" : "p-2.5 flex items-center gap-2.5"
            } transition-colors`}
          >
            <MemberAvatar member={currentUser} size={collapsed ? "sm" : "md"} />
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{currentUser.fullName}</div>
                <div className="mt-1">
                  <RoleBadge role={currentUser.role} />
                </div>
              </div>
            )}
          </button>

          {!collapsed && (
            <div className="text-[11px] text-[var(--ink-subtle)] flex items-center justify-between px-1">
              <span>{isSupabaseConfigured ? "Supabase Realtime" : "Modo Local / Demo"}</span>
              {isSupabaseConfigured ? (
                <button
                  onClick={() => void signOut()}
                  title="Sair da conta"
                  className="inline-flex items-center gap-1 text-sky-400 hover:text-amber-400 transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Sair
                </button>
              ) : (
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
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 pb-20 md:pb-8 transition-[padding] duration-200 ${
          collapsed ? "md:pl-[68px]" : "md:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 h-14 border-b border-[var(--hairline)] bg-[var(--surface-1)]/90 backdrop-blur px-4 md:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:hidden">
            <div className="h-7 w-7 rounded-lg bg-[#0f172a] border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Zeus Aero</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-[var(--ink-subtle)]">
            {/* Season Switcher: ZEUS 2026 | ZEUS 2027 */}
            <div className="inline-flex rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] p-0.5 font-mono text-[11px]">
              {([2026, 2027] as SeasonYear[]).map((yr) => {
                const active = state.activeSeason === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setActiveSeason(yr)}
                    className={`rounded-md px-2 py-1 font-semibold transition-colors ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                    }`}
                  >
                    ZEUS {yr}
                  </button>
                );
              })}
            </div>

            <span className="hidden md:inline">/</span>
            <span className="hidden md:inline text-[var(--ink)] font-medium">
              {allNav.find((i) => i.id === activeTab)?.label ?? "Visão Geral"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPalette}
              title="Busca rápida (Ctrl+K)"
              className="zeus-btn h-8 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-2.5 text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:border-blue-500/50 inline-flex items-center gap-1.5"
            >
              <Command className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden lg:inline">Buscar</span>
              <kbd className="hidden sm:inline rounded border border-[var(--hairline-strong)] px-1 font-mono text-[10px]">
                Ctrl+K
              </kbd>
            </button>

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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--hairline)] bg-[var(--surface-1)]/95 backdrop-blur flex overflow-x-auto px-1 py-1.5 gap-1">
        {allNav.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative shrink-0 min-w-[56px] flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium ${
                active ? "text-blue-400 bg-blue-600/15" : "text-[var(--ink-subtle)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.shortLabel}</span>
              {"badge" in item && item.badge ? (
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
