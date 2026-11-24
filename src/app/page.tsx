"use client";

import { useState } from "react";
import { AdminView } from "@/components/AdminView";
import { AppShell, type NavTab } from "@/components/AppShell";
import { AreasView } from "@/components/AreasView";
import { DashboardView } from "@/components/DashboardView";
import { MeetingsView } from "@/components/MeetingsView";
import { RankingView } from "@/components/RankingView";
import { SprintsView } from "@/components/SprintsView";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div key={activeTab} className="zeus-tab-enter">
        {activeTab === "dashboard" && <DashboardView onNavigate={setActiveTab} />}
        {activeTab === "sprints" && <SprintsView />}
        {activeTab === "areas" && <AreasView />}
        {activeTab === "ranking" && <RankingView />}
        {activeTab === "meetings" && <MeetingsView />}
        {activeTab === "admin" && <AdminView />}
      </div>
    </AppShell>
  );
}
