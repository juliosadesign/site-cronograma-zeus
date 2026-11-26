"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  canAccessFinance,
  canApproveAccounts,
  canApproveInMeeting,
  canManageAnnouncements,
  canManageArea,
  canManageGestao,
  canManageMarketing,
  canUpdateTaskStatus,
  canViewPrivateArea,
  getReportOverrideKey,
  isTopLeadership,
} from "./domain";
import { INITIAL_ZEUS_STATE } from "./seed";
import { isSupabaseConfigured, supabase } from "./supabase";
import type {
  AircraftConcept,
  AircraftRevision,
  AircraftRevisionStatus,
  ArchiveDocType,
  AreaMembership,
  AreaRole,
  AttendanceStatus,
  CalendarCategory,
  FinancialKind,
  FinancialStatus,
  FlightCategory,
  LabSlot,
  LessonSeverity,
  MarketingKind,
  MarketingStatus,
  MeetingType,
  Member,
  NotificationConfig,
  Priority,
  Role,
  SeasonYear,
  TaskCommentKind,
  TaskStatus,
  ZeusState,
} from "./types";

const STORAGE_KEY = "zeus_aero_v3_state";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

interface ZeusContextValue {
  state: ZeusState;
  currentUser: Member;
  authLoading: boolean;
  sessionUser: User | null;
  needsOnboarding: boolean;
  authError: string | null;
  toast: ToastMessage | null;
  showToast: (type: ToastMessage["type"], message: string) => void;
  dismissToast: () => void;
  refreshRemote: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (input: {
    fullName: string;
    requestedRole: Role;
    areaMemberships: AreaMembership[];
  }) => Promise<void>;
  switchUser: (memberId: string) => void;
  resetDemo: () => void;
  setActiveSeason: (year: SeasonYear) => void;
  toggleMyLabPresence: () => void;
  voteAircraftConcept: (concept: AircraftConcept) => void;
  updateMemberLabSlots: (memberId: string, labSlots: LabSlot[]) => void;
  updateReportSectionScore: (sectionId: string, maxScore: number) => void;
  updateNotificationConfig: (patch: NotificationConfig) => void;
  saveNotificationConfigRemote: (config: NotificationConfig) => Promise<void>;
  sendTestNotification: (
    channel: "discord" | "telegram",
    override?: NotificationConfig
  ) => Promise<{ ok: boolean; error?: string }>;
  updateMemberProfile: (
    memberId: string,
    patch: {
      avatarUrl?: string;
      bio?: string;
      course?: string;
      labSchedule?: string;
      inLabNow?: boolean;
    }
  ) => void;
  setCompetitionDate: (dateIso: string) => void;
  createCalendarEvent: (input: {
    title: string;
    date: string;
    category: CalendarCategory;
    description?: string;
    areaId?: string;
  }) => void;
  deleteCalendarEvent: (eventId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  toggleDirectorValidation: (taskId: string) => void;
  toggleMeetingApproval: (taskId: string) => void;
  returnTaskFromMeeting: (taskId: string, reason: string) => void;
  createTask: (input: {
    sprintId: string;
    areaId: string;
    assigneeId: string;
    title: string;
    description: string;
    priority: Priority;
    externalUrl?: string;
    impactedAreaIds: string[];
    blockedByAreaId?: string;
    blockedReason?: string;
  }) => void;
  updateTask: (
    taskId: string,
    patch: {
      title?: string;
      description?: string;
      priority?: Priority;
      assigneeId?: string;
      externalUrl?: string;
      impactedAreaIds?: string[];
      blockedByAreaId?: string;
      blockedReason?: string;
    }
  ) => void;
  deleteTask: (taskId: string) => void;
  addTaskComment: (taskId: string, body: string, kind?: TaskCommentKind) => void;
  deleteTaskComment: (commentId: string) => void;
  createSprint: (input: { name: string; startDate: string; endDate: string }) => void;
  updateSprint: (sprintId: string, patch: { name?: string; startDate?: string; endDate?: string }) => void;
  deleteSprint: (sprintId: string) => void;
  toggleReportSection: (sectionId: string) => void;
  addReportSection: (input: {
    areaId: string;
    title: string;
    impactedAreaIds: string[];
    externalUrl?: string;
  }) => void;
  setReportOverride: (areaId: string, value: number | null, seasonYear?: SeasonYear) => void;
  saveAreaNote: (input: {
    areaId: string;
    title: string;
    content: string;
    externalUrl?: string;
  }) => void;
  updateAreaNote: (noteId: string, patch: { title?: string; content?: string; externalUrl?: string }) => void;
  deleteAreaNote: (noteId: string) => void;
  createMeeting: (input: { title: string; date: string; type: MeetingType; areaId?: string }) => void;
  setAttendance: (meetingId: string, memberId: string, status: AttendanceStatus) => void;
  createAnnouncement: (input: { title: string; content: string; pinned: boolean }) => void;
  togglePinAnnouncement: (id: string) => void;
  addArchiveDocument: (input: {
    seasonYear: number;
    areaId: string;
    title: string;
    docType: ArchiveDocType;
    externalUrl: string;
    summary: string;
    impactedAreaIds: string[];
  }) => void;
  updateArchiveDocument: (
    docId: string,
    patch: {
      title?: string;
      summary?: string;
      externalUrl?: string;
      docType?: ArchiveDocType;
      seasonYear?: number;
    }
  ) => void;
  deleteArchiveDocument: (docId: string) => void;
  toggleFlightCheckItem: (itemId: string) => void;
  addFlightCheckItem: (input: {
    category: FlightCategory;
    areaId?: string;
    title: string;
    critical: boolean;
    notes: string;
  }) => void;
  resetFlightChecklist: () => void;
  addCompetitionLesson: (input: {
    seasonYear: number;
    areaId: string;
    severity: LessonSeverity;
    title: string;
    rootCause: string;
    preventionAction: string;
    impactedAreaIds: string[];
  }) => void;
  updateCompetitionLesson: (
    lessonId: string,
    patch: { title?: string; rootCause?: string; preventionAction?: string; severity?: LessonSeverity }
  ) => void;
  toggleLessonResolved: (lessonId: string) => void;
  deleteCompetitionLesson: (lessonId: string) => void;
  addFinancialTransaction: (input: {
    seasonYear: number;
    kind: FinancialKind;
    status: FinancialStatus;
    category: string;
    areaId?: string;
    description: string;
    amountCents: number;
    transactionDate: string;
    receiptUrl?: string;
  }) => void;
  toggleFinancialStatus: (txId: string) => void;
  deleteFinancialTransaction: (txId: string) => void;
  upsertAreaBudget: (input: {
    areaId: string;
    seasonYear: number;
    plannedCents: number;
    notes: string;
  }) => void;
  addMarketingCampaign: (input: {
    seasonYear: number;
    kind: MarketingKind;
    title: string;
    partnerOrChannel: string;
    dueDate?: string;
    externalUrl?: string;
    notes: string;
    impactedAreaIds: string[];
  }) => void;
  updateMarketingCampaignStatus: (id: string, status: MarketingStatus) => void;
  deleteMarketingCampaign: (id: string) => void;
  addTeamOKR: (input: {
    seasonYear: number;
    quarter: string;
    areaId?: string;
    title: string;
    keyResult: string;
    ownerId?: string;
  }) => void;
  updateTeamOKRProgress: (id: string, progress: number) => void;
  deleteTeamOKR: (id: string) => void;
  addAircraftRevision: (input: {
    seasonYear: number;
    versionTag: string;
    title: string;
    concept: AircraftConcept;
    status: AircraftRevisionStatus;
    mtowKg?: number;
    payloadKg?: number;
    cgPercent?: number;
    externalUrl?: string;
    notes: string;
  }) => void;
  updateAircraftRevisionStatus: (id: string, status: AircraftRevisionStatus) => void;
  deleteAircraftRevision: (id: string) => void;
  simulateSignup: (input: {
    fullName: string;
    email: string;
    requestedRole: Role;
    areaMemberships: AreaMembership[];
  }) => void;
  reviewMemberAccount: (input: {
    memberId: string;
    approved: boolean;
    role: Role;
    areaMemberships: AreaMembership[];
  }) => void;
}

const ZeusContext = createContext<ZeusContextValue | null>(null);

function newId(prefix: string): string {
  if (isSupabaseConfigured && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyRemoteState(uid: string): ZeusState {
  return {
    currentUserId: uid,
    activeSeason: 2026,
    competitionDate: "2027-10-28",
    calendarEvents: [],
    conceptVotes: {},
    notificationConfig: {},
    members: [],
    sprints: [],
    tasks: [],
    taskComments: [],
    reportSections: [],
    reportOverrides: {},
    meetings: [],
    attendance: [],
    areaNotes: [],
    announcements: [],
    archiveDocuments: [],
    flightChecklist: [],
    competitionLessons: [],
    financialTransactions: [],
    areaBudgets: [],
    marketingCampaigns: [],
    teamOKRs: [],
    aircraftRevisions: [],
  };
}

function hydrateState(parsed: Partial<ZeusState>): ZeusState {
  const seedById = new Map(INITIAL_ZEUS_STATE.members.map((m) => [m.id, m]));
  const members = (parsed.members ?? INITIAL_ZEUS_STATE.members).map((m) => {
    const seedMember = seedById.get(m.id);
    const memberships: AreaMembership[] =
      m.areaMemberships ??
      seedMember?.areaMemberships ??
      m.areaIds.map((areaId) => ({
        areaId,
        role: m.directorAreaIds.includes(areaId)
          ? "diretor"
          : m.role === "calouro"
          ? "calouro"
          : "efetivado",
      }));
    return {
      ...m,
      areaMemberships: memberships,
      inLabNow: typeof m.inLabNow === "boolean" ? m.inLabNow : (seedMember?.inLabNow ?? false),
      avatarUrl: m.avatarUrl ?? seedMember?.avatarUrl,
      course: m.course ?? seedMember?.course,
      bio: m.bio ?? seedMember?.bio,
      labSchedule: m.labSchedule ?? seedMember?.labSchedule,
      labSlots: m.labSlots ?? seedMember?.labSlots ?? [],
    };
  });

  return {
    ...INITIAL_ZEUS_STATE,
    ...parsed,
    members,
    activeSeason: parsed.activeSeason ?? INITIAL_ZEUS_STATE.activeSeason,
    competitionDate: parsed.competitionDate ?? INITIAL_ZEUS_STATE.competitionDate,
    calendarEvents: (parsed.calendarEvents ?? INITIAL_ZEUS_STATE.calendarEvents).map((e) => ({
      ...e,
      seasonYear: e.seasonYear ?? 2026,
    })),
    sprints: (parsed.sprints ?? INITIAL_ZEUS_STATE.sprints).map((sp) => ({
      ...sp,
      seasonYear: sp.seasonYear ?? 2026,
    })),
    reportSections: (parsed.reportSections ?? INITIAL_ZEUS_STATE.reportSections).map((r) => ({
      ...r,
      seasonYear: r.seasonYear ?? 2026,
    })),
    meetings: (parsed.meetings ?? INITIAL_ZEUS_STATE.meetings).map((mt) => ({
      ...mt,
      seasonYear: mt.seasonYear ?? 2026,
    })),
    announcements: (parsed.announcements ?? INITIAL_ZEUS_STATE.announcements).map((a) => ({
      ...a,
      seasonYear: a.seasonYear ?? 2026,
    })),
    taskComments: parsed.taskComments ?? INITIAL_ZEUS_STATE.taskComments,
    financialTransactions: parsed.financialTransactions ?? INITIAL_ZEUS_STATE.financialTransactions,
    areaBudgets: parsed.areaBudgets ?? INITIAL_ZEUS_STATE.areaBudgets,
    marketingCampaigns: parsed.marketingCampaigns ?? INITIAL_ZEUS_STATE.marketingCampaigns,
    teamOKRs: parsed.teamOKRs ?? INITIAL_ZEUS_STATE.teamOKRs,
    aircraftRevisions: parsed.aircraftRevisions ?? INITIAL_ZEUS_STATE.aircraftRevisions,
  };
}

const FALLBACK_GUEST: Member = {
  id: "guest",
  fullName: "Convidado",
  email: "",
  role: "calouro",
  accountStatus: "pending",
  requestedRole: "calouro",
  areaIds: [],
  directorAreaIds: [],
  areaMemberships: [],
  inLabNow: false,
  createdAt: "2026-11-24",
};

export function ZeusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ZeusState>(
    isSupabaseConfigured ? emptyRemoteState("guest") : INITIAL_ZEUS_STATE
  );
  const [hydrated, setHydrated] = useState(false);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: ToastMessage["type"], message: string) => {
    setToast({ id: Date.now(), type, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4200);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const loadRemoteState = useCallback(async (user: User | null, silent = false) => {
    if (!supabase || !user) {
      setState(emptyRemoteState("guest"));
      setNeedsOnboarding(false);
      setAuthLoading(false);
      return;
    }

    if (!silent) setAuthLoading(true);
    setAuthError(null);

    try {
      const { data: ownProfile, error: ownErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (ownErr) throw ownErr;

      if (!ownProfile) {
        setNeedsOnboarding(true);
        setState(emptyRemoteState(user.id));
        setAuthLoading(false);
        return;
      }

      setNeedsOnboarding(false);

      const { data: ownAreas } = await supabase
        .from("profile_areas")
        .select("*")
        .eq("profile_id", user.id);

      const mapMember = (
        p: Record<string, unknown>,
        paRows: Array<Record<string, unknown>>
      ): Member => {
        const mine = paRows.filter((r) => r.profile_id === p.id);
        const role = p.role as Role;
        const areaMemberships: AreaMembership[] = mine.map((r) => {
          const rawAreaRole = r.area_role ? String(r.area_role) : "";
          const inferred: AreaRole =
            rawAreaRole === "diretor" || rawAreaRole === "efetivado" || rawAreaRole === "calouro"
              ? (rawAreaRole as AreaRole)
              : r.is_director
              ? "diretor"
              : role === "calouro"
              ? "calouro"
              : "efetivado";
          return {
            areaId: String(r.area_id),
            role: inferred,
          };
        });
        return {
          id: String(p.id),
          fullName: String(p.full_name),
          email: String(p.email),
          role,
          accountStatus: p.account_status as Member["accountStatus"],
          requestedRole: (p.requested_role ?? "calouro") as Role,
          areaIds: areaMemberships.map((m) => m.areaId),
          directorAreaIds: areaMemberships
            .filter((m) => m.role === "diretor")
            .map((m) => m.areaId),
          areaMemberships,
          avatarUrl: p.avatar_url ? String(p.avatar_url) : undefined,
          course: p.course ? String(p.course) : undefined,
          bio: p.bio ? String(p.bio) : undefined,
          inLabNow: Boolean(p.in_lab_now),
          labSchedule: p.lab_schedule ? String(p.lab_schedule) : undefined,
          labSlots: Array.isArray(p.lab_slots) ? (p.lab_slots as LabSlot[]) : [],
          createdAt: String(p.created_at).slice(0, 10),
        };
      };

      if (ownProfile.account_status !== "approved") {
        setState({
          ...emptyRemoteState(user.id),
          members: [mapMember(ownProfile, ownAreas ?? [])],
        });
        setAuthLoading(false);
        return;
      }

      const topLeader = isTopLeadership(ownProfile.role as Role);

      const [
        profilesRes,
        paRes,
        sprintsRes,
        tasksRes,
        commentsRes,
        sectionsRes,
        legacyOverridesRes,
        seasonOverridesRes,
        meetingsRes,
        attendanceRes,
        notesRes,
        announcementsRes,
        settingsRes,
        calendarRes,
        votesRes,
        archiveRes,
        flightRes,
        lessonsRes,
        financeRes,
        budgetsRes,
        mktRes,
        okrsRes,
        revsRes,
        notifySettingsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: true }),
        supabase.from("profile_areas").select("*"),
        supabase.from("sprints").select("*").order("start_date", { ascending: false }),
        supabase.from("sprint_tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("task_comments").select("*").order("created_at", { ascending: true }),
        supabase.from("report_sections").select("*").order("created_at", { ascending: true }),
        supabase.from("area_report_overrides").select("*"),
        supabase.from("season_report_overrides").select("*"),
        supabase.from("meetings").select("*").order("meeting_date", { ascending: false }),
        supabase.from("meeting_attendance").select("*"),
        supabase.from("area_notes").select("*").order("updated_at", { ascending: false }),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("team_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("calendar_events").select("*").order("event_date", { ascending: true }),
        supabase.from("concept_votes").select("*"),
        supabase.from("archive_documents").select("*").order("created_at", { ascending: false }),
        supabase.from("flight_checklist_items").select("*").order("created_at", { ascending: true }),
        supabase.from("competition_lessons").select("*").order("created_at", { ascending: false }),
        supabase.from("financial_transactions").select("*").order("transaction_date", { ascending: false }),
        supabase.from("area_budgets").select("*"),
        supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("team_okrs").select("*").order("created_at", { ascending: false }),
        supabase.from("aircraft_revisions").select("*").order("created_at", { ascending: false }),
        topLeader
          ? supabase.from("team_notification_settings").select("*").eq("id", 1).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const paRows = paRes.data ?? [];
      const overrides: Record<string, number | null> = {};
      for (const row of legacyOverridesRes.data ?? []) {
        overrides[getReportOverrideKey(2026, String(row.area_id))] = row.manual_percentage;
      }
      for (const row of seasonOverridesRes.data ?? []) {
        overrides[getReportOverrideKey(Number(row.season_year ?? 2026), String(row.area_id))] =
          row.manual_percentage;
      }

      const conceptVotes: Record<string, AircraftConcept> = {};
      for (const row of votesRes.data ?? []) {
        conceptVotes[String(row.profile_id)] = row.concept as AircraftConcept;
      }

      const nData = notifySettingsRes.data as Record<string, unknown> | null;
      const loadedNotifyConfig: NotificationConfig = nData
        ? {
            discordWebhookUrl: nData.discord_webhook_url ? String(nData.discord_webhook_url) : "",
            telegramBotToken: nData.telegram_bot_token ? String(nData.telegram_bot_token) : "",
            telegramChatId: nData.telegram_chat_id ? String(nData.telegram_chat_id) : "",
            autoNotifyAnnouncements: Boolean(nData.auto_notify_announcements),
            autoNotifyApprovals: Boolean(nData.auto_notify_approvals),
            autoNotifyBlockers: Boolean(nData.auto_notify_blockers),
          }
        : {};

      setState((prev) => ({
        currentUserId: user.id,
        activeSeason: prev.activeSeason ?? 2026,
        competitionDate: settingsRes.data?.competition_date ?? "2027-10-28",
        conceptVotes,
        notificationConfig: nData ? loadedNotifyConfig : (prev.notificationConfig ?? {}),
        calendarEvents: (calendarRes.data ?? []).map((ev) => ({
          id: String(ev.id),
          seasonYear: Number(ev.season_year ?? 2026),
          title: String(ev.title),
          date: String(ev.event_date),
          category: ev.category as CalendarCategory,
          description: ev.description ? String(ev.description) : undefined,
          areaId: ev.area_id ? String(ev.area_id) : undefined,
        })),
        members: (profilesRes.data ?? []).map((p) => mapMember(p, paRows)),
        sprints: (sprintsRes.data ?? []).map((sp) => ({
          id: String(sp.id),
          seasonYear: Number(sp.season_year ?? 2026),
          name: String(sp.name),
          startDate: String(sp.start_date),
          endDate: String(sp.end_date),
          isActive: Boolean(sp.is_active),
        })),
        tasks: (tasksRes.data ?? []).map((t) => ({
          id: String(t.id),
          sprintId: String(t.sprint_id),
          areaId: String(t.area_id),
          assigneeId: String(t.assignee_id),
          createdBy: String(t.created_by),
          title: String(t.title),
          description: String(t.description ?? ""),
          priority: t.priority as Priority,
          status: t.status as TaskStatus,
          directorValidated: Boolean(t.director_validated),
          directorValidatedBy: t.director_validated_by ? String(t.director_validated_by) : undefined,
          meetingApproved: Boolean(t.meeting_approved),
          meetingApprovedBy: t.meeting_approved_by ? String(t.meeting_approved_by) : undefined,
          externalUrl: t.external_url ? String(t.external_url) : undefined,
          impactedAreaIds: Array.isArray(t.impacted_area_ids)
            ? t.impacted_area_ids.map(String)
            : [],
          blockedByAreaId: t.blocked_by_area_id ? String(t.blocked_by_area_id) : undefined,
          blockedReason: t.blocked_reason ? String(t.blocked_reason) : undefined,
          createdAt: String(t.created_at).slice(0, 10),
          approvedAt: t.approved_at ? String(t.approved_at).slice(0, 10) : undefined,
        })),
        taskComments: (commentsRes.data ?? []).map((c) => ({
          id: String(c.id),
          taskId: String(c.task_id),
          authorId: String(c.author_id),
          body: String(c.body),
          kind: c.kind as TaskCommentKind,
          createdAt: String(c.created_at).slice(0, 10),
        })),
        reportSections: (sectionsRes.data ?? []).map((r) => ({
          id: String(r.id),
          seasonYear: Number(r.season_year ?? 2026),
          areaId: String(r.area_id),
          title: String(r.title),
          completed: Boolean(r.completed),
          impactedAreaIds: Array.isArray(r.impacted_area_ids)
            ? r.impacted_area_ids.map(String)
            : [],
          externalUrl: r.external_url ? String(r.external_url) : undefined,
          maxScore: typeof r.max_score === "number" ? r.max_score : 10,
        })),
        reportOverrides: overrides,
        meetings: (meetingsRes.data ?? []).map((m) => ({
          id: String(m.id),
          seasonYear: Number(m.season_year ?? 2026),
          title: String(m.title),
          date: String(m.meeting_date),
          type: m.meeting_type as MeetingType,
          areaId: m.area_id ? String(m.area_id) : undefined,
          createdBy: String(m.created_by),
        })),
        attendance: (attendanceRes.data ?? []).map((a) => ({
          meetingId: String(a.meeting_id),
          memberId: String(a.profile_id),
          status: a.status as AttendanceStatus,
        })),
        areaNotes: (notesRes.data ?? []).map((n) => ({
          id: String(n.id),
          areaId: String(n.area_id),
          authorId: String(n.author_id),
          title: String(n.title),
          content: String(n.content ?? ""),
          externalUrl: n.external_url ? String(n.external_url) : undefined,
          updatedAt: String(n.updated_at).slice(0, 10),
        })),
        announcements: (announcementsRes.data ?? []).map((a) => ({
          id: String(a.id),
          seasonYear: Number(a.season_year ?? 2026),
          authorId: String(a.author_id),
          title: String(a.title),
          content: String(a.content),
          pinned: Boolean(a.pinned),
          createdAt: String(a.created_at).slice(0, 10),
        })),
        archiveDocuments: (archiveRes.data ?? []).map((d) => ({
          id: String(d.id),
          seasonYear: Number(d.season_year ?? 2026),
          areaId: String(d.area_id),
          title: String(d.title),
          docType: d.doc_type as ArchiveDocType,
          externalUrl: String(d.external_url),
          summary: String(d.summary ?? ""),
          impactedAreaIds: Array.isArray(d.impacted_area_ids)
            ? d.impacted_area_ids.map(String)
            : [],
          createdBy: d.created_by ? String(d.created_by) : undefined,
          createdAt: String(d.created_at).slice(0, 10),
        })),
        flightChecklist: (flightRes.data ?? []).map((f) => ({
          id: String(f.id),
          seasonYear: Number(f.season_year ?? 2026),
          category: f.category as FlightCategory,
          areaId: f.area_id ? String(f.area_id) : undefined,
          title: String(f.title),
          critical: Boolean(f.critical),
          checked: Boolean(f.checked),
          notes: String(f.notes ?? ""),
        })),
        competitionLessons: (lessonsRes.data ?? []).map((l) => ({
          id: String(l.id),
          seasonYear: Number(l.season_year ?? 2026),
          areaId: String(l.area_id),
          severity: l.severity as LessonSeverity,
          title: String(l.title),
          rootCause: String(l.root_cause ?? ""),
          preventionAction: String(l.prevention_action ?? ""),
          resolved: Boolean(l.resolved),
          impactedAreaIds: Array.isArray(l.impacted_area_ids)
            ? l.impacted_area_ids.map(String)
            : [],
          createdBy: l.created_by ? String(l.created_by) : undefined,
          createdAt: String(l.created_at).slice(0, 10),
        })),
        financialTransactions: (financeRes.data ?? []).map((tx) => ({
          id: String(tx.id),
          seasonYear: Number(tx.season_year ?? 2026),
          kind: tx.kind as FinancialKind,
          status: tx.status as FinancialStatus,
          category: String(tx.category),
          areaId: tx.area_id ? String(tx.area_id) : undefined,
          description: String(tx.description),
          amountCents: Number(tx.amount_cents ?? 0),
          transactionDate: String(tx.transaction_date).slice(0, 10),
          receiptUrl: tx.receipt_url ? String(tx.receipt_url) : undefined,
          createdBy: tx.created_by ? String(tx.created_by) : undefined,
          createdAt: String(tx.created_at).slice(0, 10),
        })),
        areaBudgets: (budgetsRes.data ?? []).map((b) => ({
          areaId: String(b.area_id),
          seasonYear: Number(b.season_year ?? 2026),
          plannedCents: Number(b.planned_cents ?? 0),
          notes: String(b.notes ?? ""),
        })),
        marketingCampaigns: (mktRes.data ?? []).map((c) => ({
          id: String(c.id),
          seasonYear: Number(c.season_year ?? 2026),
          kind: c.kind as MarketingKind,
          title: String(c.title),
          partnerOrChannel: String(c.partner_or_channel ?? ""),
          status: c.status as MarketingStatus,
          dueDate: c.due_date ? String(c.due_date).slice(0, 10) : undefined,
          externalUrl: c.external_url ? String(c.external_url) : undefined,
          notes: String(c.notes ?? ""),
          impactedAreaIds: Array.isArray(c.impacted_area_ids)
            ? c.impacted_area_ids.map(String)
            : [],
          createdBy: c.created_by ? String(c.created_by) : undefined,
          createdAt: String(c.created_at).slice(0, 10),
        })),
        teamOKRs: (okrsRes.data ?? []).map((o) => ({
          id: String(o.id),
          seasonYear: Number(o.season_year ?? 2026),
          quarter: String(o.quarter ?? "Q1"),
          areaId: o.area_id ? String(o.area_id) : undefined,
          title: String(o.title),
          keyResult: String(o.key_result ?? ""),
          progress: Number(o.progress ?? 0),
          ownerId: o.owner_id ? String(o.owner_id) : undefined,
          createdAt: String(o.created_at).slice(0, 10),
        })),
        aircraftRevisions: (revsRes.data ?? []).map((rev) => ({
          id: String(rev.id),
          seasonYear: Number(rev.season_year ?? 2026),
          versionTag: String(rev.version_tag),
          title: String(rev.title),
          concept: rev.concept as AircraftConcept,
          status: rev.status as AircraftRevisionStatus,
          mtowKg: rev.mtow_kg !== null ? Number(rev.mtow_kg) : undefined,
          payloadKg: rev.payload_kg !== null ? Number(rev.payload_kg) : undefined,
          cgPercent: rev.cg_percent !== null ? Number(rev.cg_percent) : undefined,
          externalUrl: rev.external_url ? String(rev.external_url) : undefined,
          notes: String(rev.notes ?? ""),
          createdBy: rev.created_by ? String(rev.created_by) : undefined,
          createdAt: String(rev.created_at).slice(0, 10),
        })),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar dados do Supabase";
      setAuthError(msg);
      showToast("error", msg);
    } finally {
      if (!silent) setAuthLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ZeusState>;
          if (parsed?.members?.length) {
            setState(hydrateState(parsed));
          }
        }
      } catch {
        // corrupted localStorage falls back to INITIAL_ZEUS_STATE
      } finally {
        setHydrated(true);
        setAuthLoading(false);
      }
      return;
    }

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setSessionUser(data.user ?? null);
      void loadRemoteState(data.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setSessionUser(u);
      void loadRemoteState(u);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRemoteState]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !sessionUser) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleSilentRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void loadRemoteState(sessionUser, true);
      }, 450);
    };

    const channel = supabase
      .channel("zeus-v3-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sprint_tasks" }, scheduleSilentRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleSilentRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments" }, scheduleSilentRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, scheduleSilentRefresh)
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase?.removeChannel(channel);
    };
  }, [loadRemoteState, sessionUser]);

  useEffect(() => {
    if (isSupabaseConfigured || !hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated]);

  const currentUser = useMemo(
    () => state.members.find((m) => m.id === state.currentUserId) ?? state.members[0] ?? FALLBACK_GUEST,
    [state.members, state.currentUserId]
  );

  const runRemote = useCallback(
    async (
      op: () => PromiseLike<{ error: { message: string } | null }>,
      successNotice?: string
    ) => {
      if (!isSupabaseConfigured || !supabase) return;
      const { error } = await op();
      if (error) {
        setAuthError(error.message);
        showToast("error", `Erro ao salvar: ${error.message}`);
        await loadRemoteState(sessionUser, true);
      } else if (successNotice) {
        showToast("success", successNotice);
      }
    },
    [loadRemoteState, sessionUser, showToast]
  );

  const sendChannelNotification = useCallback(
    async (
      channel: "discord" | "telegram",
      title: string,
      message: string,
      override?: NotificationConfig
    ): Promise<{ ok: boolean; error?: string }> => {
      const cfg = override ?? state.notificationConfig;
      if (!supabase) {
        return { ok: false, error: "Disponível quando conectado ao Supabase." };
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        return { ok: false, error: "Sessão expirada. Faça login novamente." };
      }

      const res = await fetch("/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel,
          webhookUrl: cfg.discordWebhookUrl,
          botToken: cfg.telegramBotToken,
          chatId: cfg.telegramChatId,
          useStoredConfig: true,
          title,
          message,
        }),
      });
      return (await res.json()) as { ok: boolean; error?: string };
    },
    [state.notificationConfig]
  );

  const dispatchAutoNotification = useCallback(
    (
      eventType: "announcement" | "approval" | "blocker",
      title: string,
      message: string
    ) => {
      if (!isSupabaseConfigured || !supabase || !isTopLeadership(currentUser.role)) return;
      const cfg = state.notificationConfig;
      const enabled =
        (eventType === "announcement" && cfg.autoNotifyAnnouncements) ||
        (eventType === "approval" && cfg.autoNotifyApprovals) ||
        (eventType === "blocker" && cfg.autoNotifyBlockers);
      if (!enabled) return;

      if (cfg.discordWebhookUrl?.trim()) {
        void sendChannelNotification("discord", title, message);
      }
      if (cfg.telegramBotToken?.trim() && cfg.telegramChatId?.trim()) {
        void sendChannelNotification("telegram", title, message);
      }
    },
    [currentUser.role, sendChannelNotification, state.notificationConfig]
  );

  const value = useMemo<ZeusContextValue>(
    () => ({
      state,
      currentUser,
      authLoading,
      sessionUser,
      needsOnboarding,
      authError,
      toast,
      showToast,
      dismissToast,
      refreshRemote: () => loadRemoteState(sessionUser),
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setSessionUser(null);
        setState(emptyRemoteState("guest"));
      },
      completeOnboarding: async ({ fullName, requestedRole, areaMemberships }) => {
        if (!supabase || !sessionUser) return;
        const membershipsPayload = (
          areaMemberships.length ? areaMemberships : [{ areaId: "aerodinamica", role: "calouro" }]
        ).map((m) => ({ area_id: m.areaId, area_role: m.role }));

        const { error } = await supabase.rpc("register_or_bootstrap_profile_v3", {
          p_full_name: fullName,
          p_email: sessionUser.email ?? "",
          p_requested_role: requestedRole,
          p_area_memberships: membershipsPayload,
        });
        if (error) {
          setAuthError(error.message);
          showToast("error", error.message);
          return;
        }
        await loadRemoteState(sessionUser);
      },
      switchUser: (memberId) => setState((s) => ({ ...s, currentUserId: memberId })),
      resetDemo: () => {
        if (isSupabaseConfigured) return;
        localStorage.removeItem(STORAGE_KEY);
        setState(INITIAL_ZEUS_STATE);
        showToast("info", "Dados de demonstração restaurados.");
      },
      setActiveSeason: (year) => setState((s) => ({ ...s, activeSeason: year })),
      toggleMyLabPresence: () => {
        const next = !currentUser.inLabNow;
        setState((s) => ({
          ...s,
          members: s.members.map((m) =>
            m.id === s.currentUserId ? { ...m, inLabNow: next } : m
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("profiles").update({ in_lab_now: next }).eq("id", currentUser.id)
          );
        }
      },
      voteAircraftConcept: (concept) => {
        setState((s) => ({
          ...s,
          conceptVotes: { ...s.conceptVotes, [currentUser.id]: concept },
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("concept_votes").upsert({
              profile_id: currentUser.id,
              concept,
              updated_at: new Date().toISOString(),
            })
          );
        }
      },
      updateMemberLabSlots: (memberId, labSlots) => {
        if (currentUser.id !== memberId && !isTopLeadership(currentUser.role)) return;
        setState((s) => ({
          ...s,
          members: s.members.map((m) => (m.id === memberId ? { ...m, labSlots } : m)),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("profiles").update({ lab_slots: labSlots }).eq("id", memberId)
          );
        }
      },
      updateReportSectionScore: (sectionId, maxScore) => {
        const target = state.reportSections.find((r) => r.id === sectionId);
        if (!target || !canManageArea(currentUser, target.areaId)) return;
        const safeScore = Math.max(0, Math.min(200, Math.round(maxScore || 0)));
        setState((s) => ({
          ...s,
          reportSections: s.reportSections.map((r) =>
            r.id === sectionId ? { ...r, maxScore: safeScore } : r
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("report_sections").update({ max_score: safeScore }).eq("id", sectionId)
          );
        }
      },
      updateNotificationConfig: (patch) => {
        if (!canApproveAccounts(currentUser)) return;
        setState((s) => ({
          ...s,
          notificationConfig: { ...s.notificationConfig, ...patch },
        }));
      },
      saveNotificationConfigRemote: async (config) => {
        if (!canApproveAccounts(currentUser)) return;
        setState((s) => ({ ...s, notificationConfig: config }));
        if (isSupabaseConfigured && supabase) {
          await runRemote(
            () =>
              supabase!.from("team_notification_settings").upsert({
                id: 1,
                discord_webhook_url: config.discordWebhookUrl?.trim() || null,
                telegram_bot_token: config.telegramBotToken?.trim() || null,
                telegram_chat_id: config.telegramChatId?.trim() || null,
                auto_notify_announcements: Boolean(config.autoNotifyAnnouncements),
                auto_notify_approvals: Boolean(config.autoNotifyApprovals),
                auto_notify_blockers: Boolean(config.autoNotifyBlockers),
                updated_by: currentUser.id,
                updated_at: new Date().toISOString(),
              }),
            "Configuração de bots salva com segurança."
          );
        } else {
          showToast("success", "Configuração salva localmente.");
        }
      },
      sendTestNotification: (channel, override) =>
        sendChannelNotification(
          channel,
          "Teste Zeus AeroDesign",
          "Integração de avisos da Sprint conectada com sucesso!",
          override
        ),
      updateMemberProfile: (memberId, patch) => {
        if (currentUser.id !== memberId && !isTopLeadership(currentUser.role)) return;
        setState((s) => ({
          ...s,
          members: s.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
        }));
        if (isSupabaseConfigured && supabase) {
          const dbPatch: Record<string, unknown> = {};
          if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
          if (patch.bio !== undefined) dbPatch.bio = patch.bio;
          if (patch.course !== undefined) dbPatch.course = patch.course;
          if (patch.labSchedule !== undefined) dbPatch.lab_schedule = patch.labSchedule;
          if (patch.inLabNow !== undefined) dbPatch.in_lab_now = patch.inLabNow;
          void runRemote(() => supabase!.from("profiles").update(dbPatch).eq("id", memberId));
        }
      },
      setCompetitionDate: (dateIso) => {
        if (!canApproveInMeeting(currentUser) || !dateIso) return;
        setState((s) => ({
          ...s,
          competitionDate: dateIso,
          calendarEvents: s.calendarEvents.map((ev) =>
            ev.category === "competition" ? { ...ev, date: dateIso } : ev
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("team_settings").upsert({ id: 1, competition_date: dateIso })
          );
        }
      },
      createCalendarEvent: (input) => {
        const allowed =
          canApproveInMeeting(currentUser) ||
          Boolean(input.areaId && canManageArea(currentUser, input.areaId));
        if (!allowed) return;
        const id = newId("ev");
        const seasonYear = state.activeSeason;
        setState((s) => ({
          ...s,
          calendarEvents: [{ id, seasonYear, ...input }, ...s.calendarEvents],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("calendar_events").insert({
              id,
              season_year: seasonYear,
              title: input.title,
              event_date: input.date,
              category: input.category,
              description: input.description ?? null,
              area_id: input.areaId ?? null,
              created_by: currentUser.id,
            })
          );
        }
      },
      deleteCalendarEvent: (eventId) => {
        const ev = state.calendarEvents.find((item) => item.id === eventId);
        if (!ev) return;
        const allowed =
          canApproveInMeeting(currentUser) ||
          Boolean(ev.areaId && canManageArea(currentUser, ev.areaId));
        if (!allowed) return;
        setState((s) => ({
          ...s,
          calendarEvents: s.calendarEvents.filter((item) => item.id !== eventId),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("calendar_events").delete().eq("id", eventId));
        }
      },
      updateTaskStatus: (taskId, status) => {
        const target = state.tasks.find((t) => t.id === taskId);
        if (!target || !canUpdateTaskStatus(currentUser, target)) return;
        const nextDirector = status === "green" ? target.directorValidated : false;
        const nextMeeting = status === "green" ? target.meetingApproved : false;
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status, directorValidated: nextDirector, meetingApproved: nextMeeting }
              : t
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!
              .from("sprint_tasks")
              .update({
                status,
                director_validated: nextDirector,
                meeting_approved: nextMeeting,
              })
              .eq("id", taskId)
          );
        }
      },
      toggleDirectorValidation: (taskId) => {
        const target = state.tasks.find((t) => t.id === taskId);
        if (!target || !canManageArea(currentUser, target.areaId)) return;
        const next = !target.directorValidated;
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: next ? "green" : t.status,
                  directorValidated: next,
                  directorValidatedBy: next ? currentUser.id : undefined,
                  meetingApproved: next ? t.meetingApproved : false,
                }
              : t
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!
              .from("sprint_tasks")
              .update({
                status: next ? "green" : target.status,
                director_validated: next,
                director_validated_by: next ? currentUser.id : null,
                meeting_approved: next ? target.meetingApproved : false,
              })
              .eq("id", taskId)
          );
        }
      },
      toggleMeetingApproval: (taskId) => {
        if (!canApproveInMeeting(currentUser)) return;
        const target = state.tasks.find((t) => t.id === taskId);
        if (!target) return;
        const next = !target.meetingApproved;
        const today = new Date().toISOString().slice(0, 10);
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: next ? "green" : t.status,
                  directorValidated: next ? true : t.directorValidated,
                  meetingApproved: next,
                  meetingApprovedBy: next ? currentUser.id : undefined,
                  approvedAt: next ? today : undefined,
                }
              : t
          ),
        }));
        if (next) {
          dispatchAutoNotification(
            "approval",
            "Entrega aprovada em reunião",
            `${target.title} (${target.areaId.toUpperCase()}) foi oficializada por ${currentUser.fullName}.`
          );
        }
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!
              .from("sprint_tasks")
              .update({
                status: next ? "green" : target.status,
                director_validated: next ? true : target.directorValidated,
                meeting_approved: next,
                meeting_approved_by: next ? currentUser.id : null,
                approved_at: next ? new Date().toISOString() : null,
              })
              .eq("id", taskId)
          );
        }
      },
      returnTaskFromMeeting: (taskId, reason) => {
        const target = state.tasks.find((t) => t.id === taskId);
        if (!target || (!canApproveInMeeting(currentUser) && !canManageArea(currentUser, target.areaId))) {
          return;
        }
        const commentId = newId("tc");
        const cleanReason = reason.trim() || "Ajuste solicitado durante revisão.";
        const today = new Date().toISOString().slice(0, 10);
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: "yellow", directorValidated: false, meetingApproved: false }
              : t
          ),
          taskComments: [
            ...s.taskComments,
            { id: commentId, taskId, authorId: currentUser.id, body: cleanReason, kind: "rejection", createdAt: today },
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await runRemote(() =>
              supabase!
                .from("sprint_tasks")
                .update({
                  status: "yellow",
                  director_validated: false,
                  meeting_approved: false,
                })
                .eq("id", taskId)
            );
            await runRemote(() =>
              supabase!.from("task_comments").insert({
                id: commentId,
                task_id: taskId,
                author_id: currentUser.id,
                body: cleanReason,
                kind: "rejection",
              })
            );
          })();
        }
      },
      createTask: (input) => {
        if (!canManageArea(currentUser, input.areaId)) return;
        const id = newId("t");
        setState((s) => ({
          ...s,
          tasks: [
            {
              id,
              ...input,
              createdBy: currentUser.id,
              status: "red",
              directorValidated: false,
              meetingApproved: false,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...s.tasks,
          ],
        }));
        if (input.blockedByAreaId) {
          dispatchAutoNotification(
            "blocker",
            "Novo bloqueio registrado",
            `${input.title} bloqueada por ${input.blockedByAreaId.toUpperCase()}: ${input.blockedReason ?? ""}`
          );
        }
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("sprint_tasks").insert({
              id,
              sprint_id: input.sprintId,
              area_id: input.areaId,
              assignee_id: input.assigneeId,
              created_by: currentUser.id,
              title: input.title,
              description: input.description,
              priority: input.priority,
              status: "red",
              external_url: input.externalUrl ?? null,
              impacted_area_ids: input.impactedAreaIds,
              blocked_by_area_id: input.blockedByAreaId ?? null,
              blocked_reason: input.blockedReason ?? "",
            })
          );
        }
      },
      updateTask: (taskId, patch) => {
        const target = state.tasks.find((t) => t.id === taskId);
        if (!target || !canManageArea(currentUser, target.areaId)) return;
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
        }));
        if (patch.blockedByAreaId && patch.blockedByAreaId !== target.blockedByAreaId) {
          dispatchAutoNotification(
            "blocker",
            "Bloqueio em tarefa de Sprint",
            `${patch.title ?? target.title} aguardando ${patch.blockedByAreaId.toUpperCase()}: ${patch.blockedReason ?? ""}`
          );
        }
        if (isSupabaseConfigured && supabase) {
          const dbPatch: Record<string, unknown> = {};
          if (patch.title !== undefined) dbPatch.title = patch.title;
          if (patch.description !== undefined) dbPatch.description = patch.description;
          if (patch.priority !== undefined) dbPatch.priority = patch.priority;
          if (patch.assigneeId !== undefined) dbPatch.assignee_id = patch.assigneeId;
          if (patch.externalUrl !== undefined) dbPatch.external_url = patch.externalUrl || null;
          if (patch.impactedAreaIds !== undefined) dbPatch.impacted_area_ids = patch.impactedAreaIds;
          if (patch.blockedByAreaId !== undefined) dbPatch.blocked_by_area_id = patch.blockedByAreaId || null;
          if (patch.blockedReason !== undefined) dbPatch.blocked_reason = patch.blockedReason;
          void runRemote(
            () => supabase!.from("sprint_tasks").update(dbPatch).eq("id", taskId),
            "Tarefa atualizada."
          );
        }
      },
      deleteTask: (taskId) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || !canManageArea(currentUser, task.areaId)) return;
        setState((s) => ({
          ...s,
          tasks: s.tasks.filter((t) => t.id !== taskId),
          taskComments: s.taskComments.filter((c) => c.taskId !== taskId),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("sprint_tasks").delete().eq("id", taskId));
        }
      },
      addTaskComment: (taskId, body, kind = "comment") => {
        if (currentUser.accountStatus !== "approved" || !body.trim()) return;
        const id = newId("tc");
        const today = new Date().toISOString().slice(0, 10);
        setState((s) => ({
          ...s,
          taskComments: [
            ...s.taskComments,
            { id, taskId, authorId: currentUser.id, body: body.trim(), kind, createdAt: today },
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("task_comments").insert({
              id,
              task_id: taskId,
              author_id: currentUser.id,
              body: body.trim(),
              kind,
            })
          );
        }
      },
      deleteTaskComment: (commentId) => {
        const c = state.taskComments.find((item) => item.id === commentId);
        if (!c || (c.authorId !== currentUser.id && !isTopLeadership(currentUser.role))) return;
        setState((s) => ({
          ...s,
          taskComments: s.taskComments.filter((item) => item.id !== commentId),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("task_comments").delete().eq("id", commentId));
        }
      },
      createSprint: (input) => {
        if (!canApproveInMeeting(currentUser)) return;
        const id = newId("sp");
        const seasonYear = state.activeSeason;
        setState((s) => ({
          ...s,
          sprints: [
            { id, seasonYear, ...input, isActive: true },
            ...s.sprints.map((sp) =>
              sp.seasonYear === seasonYear ? { ...sp, isActive: false } : sp
            ),
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await supabase
              .from("sprints")
              .update({ is_active: false })
              .eq("season_year", seasonYear)
              .neq("id", id);
            await runRemote(() =>
              supabase!.from("sprints").insert({
                id,
                season_year: seasonYear,
                name: input.name,
                start_date: input.startDate,
                end_date: input.endDate,
                is_active: true,
              })
            );
          })();
        }
      },
      updateSprint: (sprintId, patch) => {
        if (!canApproveInMeeting(currentUser)) return;
        setState((s) => ({
          ...s,
          sprints: s.sprints.map((sp) => (sp.id === sprintId ? { ...sp, ...patch } : sp)),
        }));
        if (isSupabaseConfigured && supabase) {
          const dbPatch: Record<string, unknown> = {};
          if (patch.name !== undefined) dbPatch.name = patch.name;
          if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
          if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate;
          void runRemote(
            () => supabase!.from("sprints").update(dbPatch).eq("id", sprintId),
            "Sprint atualizada."
          );
        }
      },
      deleteSprint: (sprintId) => {
        if (!canApproveInMeeting(currentUser)) return;
        const remaining = state.sprints.filter((sp) => sp.id !== sprintId);
        const hasActive = remaining.some((sp) => sp.seasonYear === state.activeSeason && sp.isActive);
        const nextSprints =
          !hasActive && remaining.length > 0
            ? remaining.map((sp, i) => (i === 0 ? { ...sp, isActive: true } : sp))
            : remaining;
        setState((s) => ({
          ...s,
          sprints: nextSprints,
          tasks: s.tasks.filter((t) => t.sprintId !== sprintId),
        }));
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await runRemote(() => supabase!.from("sprints").delete().eq("id", sprintId));
            if (!hasActive && nextSprints[0]) {
              await supabase
                .from("sprints")
                .update({ is_active: true })
                .eq("id", nextSprints[0].id);
            }
          })();
        }
      },
      toggleReportSection: (sectionId) => {
        const target = state.reportSections.find((r) => r.id === sectionId);
        if (!target || !canManageArea(currentUser, target.areaId)) return;
        const next = !target.completed;
        setState((s) => ({
          ...s,
          reportSections: s.reportSections.map((r) =>
            r.id === sectionId ? { ...r, completed: next } : r
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("report_sections").update({ completed: next }).eq("id", sectionId)
          );
        }
      },
      addReportSection: (input) => {
        if (!canManageArea(currentUser, input.areaId)) return;
        const id = newId("r");
        const seasonYear = state.activeSeason;
        setState((s) => ({
          ...s,
          reportSections: [
            ...s.reportSections,
            { id, seasonYear, completed: false, maxScore: 10, ...input },
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("report_sections").insert({
              id,
              season_year: seasonYear,
              area_id: input.areaId,
              title: input.title,
              completed: false,
              max_score: 10,
              impacted_area_ids: input.impactedAreaIds,
              external_url: input.externalUrl ?? null,
            })
          );
        }
      },
      setReportOverride: (areaId, value, seasonYear) => {
        if (!canManageArea(currentUser, areaId)) return;
        const targetSeason = seasonYear ?? state.activeSeason;
        const key = getReportOverrideKey(targetSeason, areaId);
        setState((s) => ({
          ...s,
          reportOverrides: { ...s.reportOverrides, [key]: value },
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("season_report_overrides").upsert({
              area_id: areaId,
              season_year: targetSeason,
              manual_percentage: value,
              updated_by: currentUser.id,
              updated_at: new Date().toISOString(),
            })
          );
        }
      },
      saveAreaNote: (input) => {
        if (!canViewPrivateArea(currentUser, input.areaId)) return;
        const id = newId("an");
        setState((s) => ({
          ...s,
          areaNotes: [
            {
              id,
              ...input,
              authorId: currentUser.id,
              updatedAt: new Date().toISOString().slice(0, 10),
            },
            ...s.areaNotes,
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("area_notes").insert({
              id,
              area_id: input.areaId,
              author_id: currentUser.id,
              title: input.title,
              content: input.content,
              external_url: input.externalUrl ?? null,
            })
          );
        }
      },
      updateAreaNote: (noteId, patch) => {
        const note = state.areaNotes.find((n) => n.id === noteId);
        if (!note || (!canManageArea(currentUser, note.areaId) && note.authorId !== currentUser.id)) {
          return;
        }
        const today = new Date().toISOString().slice(0, 10);
        setState((s) => ({
          ...s,
          areaNotes: s.areaNotes.map((n) =>
            n.id === noteId ? { ...n, ...patch, updatedAt: today } : n
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (patch.title !== undefined) dbPatch.title = patch.title;
          if (patch.content !== undefined) dbPatch.content = patch.content;
          if (patch.externalUrl !== undefined) dbPatch.external_url = patch.externalUrl || null;
          void runRemote(() => supabase!.from("area_notes").update(dbPatch).eq("id", noteId));
        }
      },
      deleteAreaNote: (noteId) => {
        const note = state.areaNotes.find((n) => n.id === noteId);
        if (!note || !canManageArea(currentUser, note.areaId)) return;
        setState((s) => ({
          ...s,
          areaNotes: s.areaNotes.filter((n) => n.id !== noteId),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("area_notes").delete().eq("id", noteId));
        }
      },
      createMeeting: (input) => {
        const allowed =
          input.type === "general"
            ? canApproveInMeeting(currentUser)
            : Boolean(input.areaId && canManageArea(currentUser, input.areaId));
        if (!allowed) return;
        const id = newId("mt");
        const seasonYear = state.activeSeason;
        const approvedMembers = state.members.filter(
          (m) =>
            m.accountStatus === "approved" &&
            (input.type === "general" || (input.areaId ? m.areaIds.includes(input.areaId) : false))
        );
        setState((s) => ({
          ...s,
          meetings: [{ id, seasonYear, ...input, createdBy: currentUser.id }, ...s.meetings],
          attendance: [
            ...s.attendance,
            ...approvedMembers.map((m) => ({
              meetingId: id,
              memberId: m.id,
              status: "present" as AttendanceStatus,
            })),
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            const { error } = await supabase.from("meetings").insert({
              id,
              season_year: seasonYear,
              title: input.title,
              meeting_date: input.date,
              meeting_type: input.type,
              area_id: input.areaId ?? null,
              created_by: currentUser.id,
            });
            if (error) {
              setAuthError(error.message);
              showToast("error", error.message);
              await loadRemoteState(sessionUser, true);
              return;
            }
            if (approvedMembers.length > 0) {
              await supabase.from("meeting_attendance").insert(
                approvedMembers.map((m) => ({
                  meeting_id: id,
                  profile_id: m.id,
                  status: "present",
                }))
              );
            }
          })();
        }
      },
      setAttendance: (meetingId, memberId, status) => {
        const meeting = state.meetings.find((m) => m.id === meetingId);
        if (!meeting) return;
        const allowed =
          meeting.type === "general"
            ? canApproveInMeeting(currentUser)
            : Boolean(meeting.areaId && canManageArea(currentUser, meeting.areaId));
        if (!allowed) return;
        setState((s) => {
          const exists = s.attendance.some(
            (a) => a.meetingId === meetingId && a.memberId === memberId
          );
          return {
            ...s,
            attendance: exists
              ? s.attendance.map((a) =>
                  a.meetingId === meetingId && a.memberId === memberId ? { ...a, status } : a
                )
              : [...s.attendance, { meetingId, memberId, status }],
          };
        });
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("meeting_attendance").upsert({
              meeting_id: meetingId,
              profile_id: memberId,
              status,
            })
          );
        }
      },
      createAnnouncement: (input) => {
        if (!canManageAnnouncements(currentUser)) return;
        const id = newId("ann");
        const seasonYear = state.activeSeason;
        setState((s) => ({
          ...s,
          announcements: [
            {
              id,
              seasonYear,
              ...input,
              authorId: currentUser.id,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...s.announcements,
          ],
        }));
        if (input.pinned) {
          dispatchAutoNotification("announcement", input.title, input.content);
        }
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("announcements").insert({
              id,
              season_year: seasonYear,
              author_id: currentUser.id,
              title: input.title,
              content: input.content,
              pinned: input.pinned,
            })
          );
        }
      },
      togglePinAnnouncement: (id) => {
        if (!canManageAnnouncements(currentUser)) return;
        const target = state.announcements.find((a) => a.id === id);
        if (!target) return;
        const next = !target.pinned;
        setState((s) => ({
          ...s,
          announcements: s.announcements.map((a) => (a.id === id ? { ...a, pinned: next } : a)),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("announcements").update({ pinned: next }).eq("id", id)
          );
        }
      },
      addArchiveDocument: (input) => {
        if (!canManageArea(currentUser, input.areaId)) return;
        const id = newId("arc");
        setState((s) => ({
          ...s,
          archiveDocuments: [
            {
              id,
              ...input,
              createdBy: currentUser.id,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...s.archiveDocuments,
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(
            () =>
              supabase!.from("archive_documents").insert({
                id,
                season_year: input.seasonYear,
                area_id: input.areaId,
                title: input.title,
                doc_type: input.docType,
                external_url: input.externalUrl,
                summary: input.summary,
                impacted_area_ids: input.impactedAreaIds,
                created_by: currentUser.id,
              }),
            "Documento adicionado ao Acervo."
          );
        }
      },
      updateArchiveDocument: (docId, patch) => {
        const doc = state.archiveDocuments.find((d) => d.id === docId);
        if (!doc || !canManageArea(currentUser, doc.areaId)) return;
        setState((s) => ({
          ...s,
          archiveDocuments: s.archiveDocuments.map((d) =>
            d.id === docId ? { ...d, ...patch } : d
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          const dbPatch: Record<string, unknown> = {};
          if (patch.title !== undefined) dbPatch.title = patch.title;
          if (patch.summary !== undefined) dbPatch.summary = patch.summary;
          if (patch.externalUrl !== undefined) dbPatch.external_url = patch.externalUrl;
          if (patch.docType !== undefined) dbPatch.doc_type = patch.docType;
          if (patch.seasonYear !== undefined) dbPatch.season_year = patch.seasonYear;
          void runRemote(
            () => supabase!.from("archive_documents").update(dbPatch).eq("id", docId),
            "Documento atualizado."
          );
        }
      },
      deleteArchiveDocument: (docId) => {
        const doc = state.archiveDocuments.find((d) => d.id === docId);
        if (!doc || !canManageArea(currentUser, doc.areaId)) return;
        setState((s) => ({
          ...s,
          archiveDocuments: s.archiveDocuments.filter((d) => d.id !== docId),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("archive_documents").delete().eq("id", docId));
        }
      },
      toggleFlightCheckItem: (itemId) => {
        const item = state.flightChecklist.find((f) => f.id === itemId);
        if (!item) return;
        const next = !item.checked;
        setState((s) => ({
          ...s,
          flightChecklist: s.flightChecklist.map((f) =>
            f.id === itemId ? { ...f, checked: next } : f
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("flight_checklist_items").update({ checked: next }).eq("id", itemId)
          );
        }
      },
      addFlightCheckItem: (input) => {
        const allowed =
          canApproveInMeeting(currentUser) ||
          Boolean(input.areaId && canManageArea(currentUser, input.areaId));
        if (!allowed) return;
        const id = newId("fl");
        const seasonYear = state.activeSeason;
        setState((s) => ({
          ...s,
          flightChecklist: [
            ...s.flightChecklist,
            { id, seasonYear, checked: false, ...input },
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("flight_checklist_items").insert({
              id,
              season_year: seasonYear,
              category: input.category,
              area_id: input.areaId ?? null,
              title: input.title,
              critical: input.critical,
              checked: false,
              notes: input.notes,
            })
          );
        }
      },
      resetFlightChecklist: () => {
        if (!canApproveInMeeting(currentUser)) return;
        const seasonYear = state.activeSeason;
        setState((s) => ({
          ...s,
          flightChecklist: s.flightChecklist.map((f) =>
            f.seasonYear === seasonYear ? { ...f, checked: false } : f
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!
              .from("flight_checklist_items")
              .update({ checked: false })
              .eq("season_year", seasonYear)
          );
        }
      },
      addCompetitionLesson: (input) => {
        if (!canManageArea(currentUser, input.areaId)) return;
        const id = newId("les");
        setState((s) => ({
          ...s,
          competitionLessons: [
            {
              id,
              ...input,
              resolved: false,
              createdBy: currentUser.id,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...s.competitionLessons,
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("competition_lessons").insert({
              id,
              season_year: input.seasonYear,
              area_id: input.areaId,
              severity: input.severity,
              title: input.title,
              root_cause: input.rootCause,
              prevention_action: input.preventionAction,
              resolved: false,
              impacted_area_ids: input.impactedAreaIds,
              created_by: currentUser.id,
            })
          );
        }
      },
      updateCompetitionLesson: (lessonId, patch) => {
        const les = state.competitionLessons.find((l) => l.id === lessonId);
        if (!les || !canManageArea(currentUser, les.areaId)) return;
        setState((s) => ({
          ...s,
          competitionLessons: s.competitionLessons.map((l) =>
            l.id === lessonId ? { ...l, ...patch } : l
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          const dbPatch: Record<string, unknown> = {};
          if (patch.title !== undefined) dbPatch.title = patch.title;
          if (patch.rootCause !== undefined) dbPatch.root_cause = patch.rootCause;
          if (patch.preventionAction !== undefined) dbPatch.prevention_action = patch.preventionAction;
          if (patch.severity !== undefined) dbPatch.severity = patch.severity;
          void runRemote(
            () => supabase!.from("competition_lessons").update(dbPatch).eq("id", lessonId),
            "Lição atualizada."
          );
        }
      },
      toggleLessonResolved: (lessonId) => {
        const les = state.competitionLessons.find((l) => l.id === lessonId);
        if (!les || !canManageArea(currentUser, les.areaId)) return;
        const next = !les.resolved;
        setState((s) => ({
          ...s,
          competitionLessons: s.competitionLessons.map((l) =>
            l.id === lessonId ? { ...l, resolved: next } : l
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("competition_lessons").update({ resolved: next }).eq("id", lessonId)
          );
        }
      },
      deleteCompetitionLesson: (lessonId) => {
        const les = state.competitionLessons.find((l) => l.id === lessonId);
        if (!les || !canManageArea(currentUser, les.areaId)) return;
        setState((s) => ({
          ...s,
          competitionLessons: s.competitionLessons.filter((l) => l.id !== lessonId),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("competition_lessons").delete().eq("id", lessonId));
        }
      },
      addFinancialTransaction: (input) => {
        if (!canAccessFinance(currentUser)) return;
        const id = newId("fin");
        const today = new Date().toISOString().slice(0, 10);
        setState((s) => ({
          ...s,
          financialTransactions: [
            { id, ...input, createdBy: currentUser.id, createdAt: today },
            ...s.financialTransactions,
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(
            () =>
              supabase!.from("financial_transactions").insert({
                id,
                season_year: input.seasonYear,
                kind: input.kind,
                status: input.status,
                category: input.category,
                area_id: input.areaId || null,
                description: input.description,
                amount_cents: input.amountCents,
                transaction_date: input.transactionDate,
                receipt_url: input.receiptUrl || null,
                created_by: currentUser.id,
              }),
            "Lançamento financeiro registrado."
          );
        }
      },
      toggleFinancialStatus: (txId) => {
        if (!canAccessFinance(currentUser)) return;
        const target = state.financialTransactions.find((t) => t.id === txId);
        if (!target) return;
        const nextStatus: FinancialStatus = target.status === "paid" ? "pending" : "paid";
        setState((s) => ({
          ...s,
          financialTransactions: s.financialTransactions.map((t) =>
            t.id === txId ? { ...t, status: nextStatus } : t
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("financial_transactions").update({ status: nextStatus }).eq("id", txId)
          );
        }
      },
      deleteFinancialTransaction: (txId) => {
        if (!canAccessFinance(currentUser)) return;
        setState((s) => ({
          ...s,
          financialTransactions: s.financialTransactions.filter((t) => t.id !== txId),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("financial_transactions").delete().eq("id", txId));
        }
      },
      upsertAreaBudget: (input) => {
        if (!canAccessFinance(currentUser)) return;
        setState((s) => {
          const exists = s.areaBudgets.some(
            (b) => b.areaId === input.areaId && b.seasonYear === input.seasonYear
          );
          return {
            ...s,
            areaBudgets: exists
              ? s.areaBudgets.map((b) =>
                  b.areaId === input.areaId && b.seasonYear === input.seasonYear ? input : b
                )
              : [...s.areaBudgets, input],
          };
        });
        if (isSupabaseConfigured && supabase) {
          void runRemote(
            () =>
              supabase!.from("area_budgets").upsert({
                area_id: input.areaId,
                season_year: input.seasonYear,
                planned_cents: input.plannedCents,
                notes: input.notes,
                updated_by: currentUser.id,
                updated_at: new Date().toISOString(),
              }),
            "Orçamento da área atualizado."
          );
        }
      },
      addMarketingCampaign: (input) => {
        if (!canManageMarketing(currentUser)) return;
        const id = newId("mkt");
        const today = new Date().toISOString().slice(0, 10);
        setState((s) => ({
          ...s,
          marketingCampaigns: [
            { id, ...input, status: "planned", createdBy: currentUser.id, createdAt: today },
            ...s.marketingCampaigns,
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(
            () =>
              supabase!.from("marketing_campaigns").insert({
                id,
                season_year: input.seasonYear,
                kind: input.kind,
                title: input.title,
                partner_or_channel: input.partnerOrChannel,
                status: "planned",
                due_date: input.dueDate || null,
                external_url: input.externalUrl || null,
                notes: input.notes,
                impacted_area_ids: input.impactedAreaIds,
                created_by: currentUser.id,
              }),
            "Ação de Marketing criada."
          );
        }
      },
      updateMarketingCampaignStatus: (id, status) => {
        if (!canManageMarketing(currentUser)) return;
        setState((s) => ({
          ...s,
          marketingCampaigns: s.marketingCampaigns.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("marketing_campaigns").update({ status }).eq("id", id)
          );
        }
      },
      deleteMarketingCampaign: (id) => {
        if (!canManageMarketing(currentUser)) return;
        setState((s) => ({
          ...s,
          marketingCampaigns: s.marketingCampaigns.filter((c) => c.id !== id),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("marketing_campaigns").delete().eq("id", id));
        }
      },
      addTeamOKR: (input) => {
        if (!canManageGestao(currentUser)) return;
        const id = newId("okr");
        const today = new Date().toISOString().slice(0, 10);
        setState((s) => ({
          ...s,
          teamOKRs: [{ id, ...input, progress: 0, createdAt: today }, ...s.teamOKRs],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(
            () =>
              supabase!.from("team_okrs").insert({
                id,
                season_year: input.seasonYear,
                quarter: input.quarter,
                area_id: input.areaId || null,
                title: input.title,
                key_result: input.keyResult,
                progress: 0,
                owner_id: input.ownerId || null,
                created_by: currentUser.id,
              }),
            "OKR cadastrado."
          );
        }
      },
      updateTeamOKRProgress: (id, progress) => {
        if (!canManageGestao(currentUser)) return;
        const safe = Math.max(0, Math.min(100, Math.round(progress)));
        setState((s) => ({
          ...s,
          teamOKRs: s.teamOKRs.map((o) => (o.id === id ? { ...o, progress: safe } : o)),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("team_okrs").update({ progress: safe }).eq("id", id));
        }
      },
      deleteTeamOKR: (id) => {
        if (!canManageGestao(currentUser)) return;
        setState((s) => ({
          ...s,
          teamOKRs: s.teamOKRs.filter((o) => o.id !== id),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("team_okrs").delete().eq("id", id));
        }
      },
      addAircraftRevision: (input) => {
        const allowed =
          isTopLeadership(currentUser.role) ||
          canManageArea(currentUser, "integracao") ||
          canManageArea(currentUser, "aerodinamica") ||
          canManageArea(currentUser, "estruturas");
        if (!allowed) return;
        const id = newId("rev");
        const today = new Date().toISOString().slice(0, 10);
        setState((s) => ({
          ...s,
          aircraftRevisions: [
            { id, ...input, createdBy: currentUser.id, createdAt: today },
            ...s.aircraftRevisions,
          ],
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(
            () =>
              supabase!.from("aircraft_revisions").insert({
                id,
                season_year: input.seasonYear,
                version_tag: input.versionTag,
                title: input.title,
                concept: input.concept,
                status: input.status,
                mtow_kg: input.mtowKg ?? null,
                payload_kg: input.payloadKg ?? null,
                cg_percent: input.cgPercent ?? null,
                external_url: input.externalUrl || null,
                notes: input.notes,
                created_by: currentUser.id,
              }),
            `Revisão ${input.versionTag} registrada.`
          );
        }
      },
      updateAircraftRevisionStatus: (id, status) => {
        const allowed =
          isTopLeadership(currentUser.role) ||
          canManageArea(currentUser, "integracao") ||
          canManageArea(currentUser, "aerodinamica") ||
          canManageArea(currentUser, "estruturas");
        if (!allowed) return;
        setState((s) => ({
          ...s,
          aircraftRevisions: s.aircraftRevisions.map((r) => (r.id === id ? { ...r, status } : r)),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() =>
            supabase!.from("aircraft_revisions").update({ status }).eq("id", id)
          );
        }
      },
      deleteAircraftRevision: (id) => {
        const allowed =
          isTopLeadership(currentUser.role) ||
          canManageArea(currentUser, "integracao") ||
          canManageArea(currentUser, "aerodinamica") ||
          canManageArea(currentUser, "estruturas");
        if (!allowed) return;
        setState((s) => ({
          ...s,
          aircraftRevisions: s.aircraftRevisions.filter((r) => r.id !== id),
        }));
        if (isSupabaseConfigured && supabase) {
          void runRemote(() => supabase!.from("aircraft_revisions").delete().eq("id", id));
        }
      },
      simulateSignup: (input) => {
        if (isSupabaseConfigured) return;
        const memberships: AreaMembership[] = input.areaMemberships.length
          ? input.areaMemberships
          : [{ areaId: "aerodinamica", role: "calouro" }];
        setState((s) => ({
          ...s,
          members: [
            ...s.members,
            {
              id: newId("m"),
              fullName: input.fullName,
              email: input.email,
              role: "calouro",
              accountStatus: "pending",
              requestedRole: input.requestedRole,
              areaIds: memberships.map((m) => m.areaId),
              directorAreaIds: [],
              areaMemberships: memberships,
              inLabNow: false,
              createdAt: new Date().toISOString().slice(0, 10),
            },
          ],
        }));
      },
      reviewMemberAccount: (input) => {
        if (!canApproveAccounts(currentUser)) return;
        const nextStatus = input.approved ? "approved" : "rejected";
        const memberships: AreaMembership[] = input.areaMemberships.length
          ? input.areaMemberships
          : [{ areaId: "aerodinamica", role: "calouro" }];
        const areaIds = memberships.map((m) => m.areaId);
        const directorAreaIds = memberships
          .filter((m) => m.role === "diretor")
          .map((m) => m.areaId);

        setState((s) => ({
          ...s,
          members: s.members.map((m) =>
            m.id === input.memberId
              ? {
                  ...m,
                  accountStatus: nextStatus,
                  role: input.role,
                  areaIds,
                  directorAreaIds,
                  areaMemberships: memberships,
                }
              : m
          ),
        }));
        if (isSupabaseConfigured && supabase) {
          void (async () => {
            await runRemote(() =>
              supabase!
                .from("profiles")
                .update({ account_status: nextStatus, role: input.role })
                .eq("id", input.memberId)
            );
            await supabase!.from("profile_areas").delete().eq("profile_id", input.memberId);
            await runRemote(
              () =>
                supabase!.from("profile_areas").insert(
                  memberships.map((m) => ({
                    profile_id: input.memberId,
                    area_id: m.areaId,
                    area_role: m.role,
                    is_director: m.role === "diretor",
                  }))
                ),
              "Permissões do membro atualizadas."
            );
          })();
        } else {
          showToast("success", "Permissões do membro atualizadas.");
        }
      },
    }),
    [
      state,
      currentUser,
      authLoading,
      sessionUser,
      needsOnboarding,
      authError,
      toast,
      showToast,
      dismissToast,
      loadRemoteState,
      runRemote,
      sendChannelNotification,
      dispatchAutoNotification,
    ]
  );

  return <ZeusContext.Provider value={value}>{children}</ZeusContext.Provider>;
}

export function useZeus(): ZeusContextValue {
  const ctx = useContext(ZeusContext);
  if (!ctx) throw new Error("useZeus must be used inside ZeusProvider");
  return ctx;
}
