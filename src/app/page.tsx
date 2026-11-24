"use client";

import { useState } from "react";
import { AdminView } from "@/components/AdminView";
import { AppShell, type NavTab } from "@/components/AppShell";
import { AreasView } from "@/components/AreasView";
import { CalendarView } from "@/components/CalendarView";
import { DashboardView } from "@/components/DashboardView";
import { MeetingsView } from "@/components/MeetingsView";
import { MemberProfileModal } from "@/components/MemberProfileModal";
import { RankingView } from "@/components/RankingView";
import { SprintsView } from "@/components/SprintsView";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onOpenProfile={setProfileMemberId}
    >
      <div key={activeTab} className="zeus-tab-enter">
        {activeTab === "dashboard" && (
          <DashboardView onNavigate={setActiveTab} onOpenProfile={setProfileMemberId} />
        )}
        {activeTab === "sprints" && <SprintsView onOpenProfile={setProfileMemberId} />}
        {activeTab === "areas" && <AreasView onOpenProfile={setProfileMemberId} />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "ranking" && <RankingView onOpenProfile={setProfileMemberId} />}
        {activeTab === "meetings" && <MeetingsView onOpenProfile={setProfileMemberId} />}
        {activeTab === "admin" && <AdminView />}
      </div>

      <MemberProfileModal
        memberId={profileMemberId}
        onClose={() => setProfileMemberId(null)}
      />
    </AppShell>
  );
}
