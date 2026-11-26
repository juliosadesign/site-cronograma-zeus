"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AdminView } from "@/components/AdminView";
import { AppShell, type NavTab } from "@/components/AppShell";
import { ArchiveView } from "@/components/ArchiveView";
import { AreasView } from "@/components/AreasView";
import { AuthGate } from "@/components/AuthGate";
import { CalendarView } from "@/components/CalendarView";
import { CommandPalette } from "@/components/CommandPalette";
import { CorporateView } from "@/components/CorporateView";
import { DashboardView } from "@/components/DashboardView";
import { DesignFreezeView } from "@/components/DesignFreezeView";
import { FlightLessonsView } from "@/components/FlightLessonsView";
import { KnowledgeGraphView } from "@/components/KnowledgeGraphView";
import { MeetingsView } from "@/components/MeetingsView";
import { MemberProfileModal } from "@/components/MemberProfileModal";
import {
  getTourCompletedSnapshot,
  OnboardingTour,
  subscribeTourCompleted,
} from "@/components/OnboardingTour";
import { RankingView } from "@/components/RankingView";
import { SprintsView } from "@/components/SprintsView";
import { ToastBanner } from "@/components/ToastBanner";

const VALID_TABS = new Set<NavTab>([
  "dashboard",
  "sprints",
  "areas",
  "graph",
  "revisoes",
  "archive",
  "flight",
  "calendar",
  "ranking",
  "meetings",
  "financeiro",
  "marketing",
  "gestao",
  "admin",
]);

function readTabFromUrl(): NavTab {
  if (typeof window === "undefined") return "dashboard";
  const param = new URLSearchParams(window.location.search).get("tab") as NavTab | null;
  return param && VALID_TABS.has(param) ? param : "dashboard";
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const tourDone = useSyncExternalStore(
    subscribeTourCompleted,
    getTourCompletedSnapshot,
    () => true
  );
  const [manualTourOpen, setManualTourOpen] = useState<boolean | null>(null);
  const tourOpen = manualTourOpen ?? !tourDone;

  useEffect(() => {
    setActiveTab(readTabFromUrl());
    const onPopState = () => setActiveTab(readTabFromUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleTabChange = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "dashboard") url.searchParams.delete("tab");
      else url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return (
    <AuthGate>
      <AppShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenProfile={setProfileMemberId}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenTour={() => setManualTourOpen(true)}
      >
        <div key={activeTab} className="zeus-tab-enter">
          {activeTab === "dashboard" && (
            <DashboardView onNavigate={handleTabChange} onOpenProfile={setProfileMemberId} />
          )}
          {activeTab === "sprints" && <SprintsView onOpenProfile={setProfileMemberId} />}
          {activeTab === "areas" && (
            <AreasView onOpenProfile={setProfileMemberId} onNavigate={handleTabChange} />
          )}
          {activeTab === "graph" && <KnowledgeGraphView />}
          {activeTab === "revisoes" && <DesignFreezeView />}
          {activeTab === "archive" && <ArchiveView />}
          {activeTab === "flight" && <FlightLessonsView />}
          {activeTab === "calendar" && <CalendarView />}
          {activeTab === "ranking" && <RankingView onOpenProfile={setProfileMemberId} />}
          {activeTab === "meetings" && <MeetingsView onOpenProfile={setProfileMemberId} />}
          {(activeTab === "financeiro" ||
            activeTab === "marketing" ||
            activeTab === "gestao") && (
            <CorporateView section={activeTab} onOpenProfile={setProfileMemberId} />
          )}
          {activeTab === "admin" && <AdminView />}
        </div>

        <MemberProfileModal
          memberId={profileMemberId}
          onClose={() => setProfileMemberId(null)}
        />
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onNavigate={handleTabChange}
          onOpenProfile={setProfileMemberId}
        />
        <OnboardingTour
          open={tourOpen}
          onClose={() => setManualTourOpen(false)}
          onNavigate={handleTabChange}
        />
        <ToastBanner />
      </AppShell>
    </AuthGate>
  );
}
