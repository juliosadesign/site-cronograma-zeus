"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  canApproveAccounts,
  canApproveInMeeting,
  canManageAnnouncements,
  canManageArea,
  canUpdateTaskStatus,
  canViewPrivateArea,
} from "./domain";
import { INITIAL_ZEUS_STATE } from "./seed";
import type {
  AttendanceStatus,
  MeetingType,
  Member,
  Priority,
  Role,
  TaskStatus,
  ZeusState,
} from "./types";

const STORAGE_KEY = "zeus_aero_v1_state";

interface ZeusContextValue {
  state: ZeusState;
  currentUser: Member;
  switchUser: (memberId: string) => void;
  resetDemo: () => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  toggleDirectorValidation: (taskId: string) => void;
  toggleMeetingApproval: (taskId: string) => void;
  createTask: (input: {
    sprintId: string;
    areaId: string;
    assigneeId: string;
    title: string;
    description: string;
    priority: Priority;
    externalUrl?: string;
    impactedAreaIds: string[];
  }) => void;
  deleteTask: (taskId: string) => void;
  createSprint: (input: { name: string; startDate: string; endDate: string }) => void;
  deleteSprint: (sprintId: string) => void;
  toggleReportSection: (sectionId: string) => void;
  addReportSection: (input: { areaId: string; title: string; impactedAreaIds: string[]; externalUrl?: string }) => void;
  setReportOverride: (areaId: string, value: number | null) => void;
  saveAreaNote: (input: { areaId: string; title: string; content: string; externalUrl?: string }) => void;
  deleteAreaNote: (noteId: string) => void;
  createMeeting: (input: { title: string; date: string; type: MeetingType; areaId?: string }) => void;
  setAttendance: (meetingId: string, memberId: string, status: AttendanceStatus) => void;
  createAnnouncement: (input: { title: string; content: string; pinned: boolean }) => void;
  togglePinAnnouncement: (id: string) => void;
  simulateSignup: (input: { fullName: string; email: string; requestedRole: Role; areaIds: string[] }) => void;
  reviewMemberAccount: (input: {
    memberId: string;
    approved: boolean;
    role: Role;
    areaIds: string[];
    directorAreaIds: string[];
  }) => void;
}

const ZeusContext = createContext<ZeusContextValue | null>(null);

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function ZeusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ZeusState>(INITIAL_ZEUS_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ZeusState;
        if (parsed?.members?.length) {
          setState(parsed);
        }
      }
    } catch {
      // shortcut: corrupted localStorage falls back to INITIAL_ZEUS_STATE
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated]);

  const currentUser = useMemo(
    () => state.members.find((m) => m.id === state.currentUserId) ?? state.members[0],
    [state.members, state.currentUserId]
  );

  const value = useMemo<ZeusContextValue>(
    () => ({
      state,
      currentUser,
      switchUser: (memberId) => setState((s) => ({ ...s, currentUserId: memberId })),
      resetDemo: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(INITIAL_ZEUS_STATE);
      },
      updateTaskStatus: (taskId, status) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          return {
            ...s,
            tasks: s.tasks.map((t) => {
              if (t.id !== taskId || !canUpdateTaskStatus(user, t)) return t;
              return {
                ...t,
                status,
                directorValidated: status === "green" ? t.directorValidated : false,
                meetingApproved: status === "green" ? t.meetingApproved : false,
              };
            }),
          };
        }),
      toggleDirectorValidation: (taskId) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          return {
            ...s,
            tasks: s.tasks.map((t) => {
              if (t.id !== taskId || !canManageArea(user, t.areaId)) return t;
              const next = !t.directorValidated;
              return {
                ...t,
                status: next ? "green" : t.status,
                directorValidated: next,
                directorValidatedBy: next ? user.id : undefined,
                meetingApproved: next ? t.meetingApproved : false,
              };
            }),
          };
        }),
      toggleMeetingApproval: (taskId) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canApproveInMeeting(user)) return s;
          return {
            ...s,
            tasks: s.tasks.map((t) => {
              if (t.id !== taskId) return t;
              const next = !t.meetingApproved;
              return {
                ...t,
                status: next ? "green" : t.status,
                directorValidated: next ? true : t.directorValidated,
                meetingApproved: next,
                meetingApprovedBy: next ? user.id : undefined,
                approvedAt: next ? new Date().toISOString().slice(0, 10) : undefined,
              };
            }),
          };
        }),
      createTask: (input) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canManageArea(user, input.areaId)) return s;
          return {
            ...s,
            tasks: [
              {
                id: uid("t"),
                ...input,
                createdBy: user.id,
                status: "red",
                directorValidated: false,
                meetingApproved: false,
                createdAt: new Date().toISOString().slice(0, 10),
              },
              ...s.tasks,
            ],
          };
        }),
      createSprint: (input) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canApproveInMeeting(user)) return s;
          return {
            ...s,
            sprints: [
              { id: uid("sp"), ...input, isActive: true },
              ...s.sprints.map((sp) => ({ ...sp, isActive: false })),
            ],
          };
        }),
      deleteTask: (taskId) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          const task = s.tasks.find((t) => t.id === taskId);
          if (!task || !canManageArea(user, task.areaId)) return s;
          return {
            ...s,
            tasks: s.tasks.filter((t) => t.id !== taskId),
          };
        }),
      deleteSprint: (sprintId) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canApproveInMeeting(user)) return s;
          const remaining = s.sprints.filter((sp) => sp.id !== sprintId);
          const hasActive = remaining.some((sp) => sp.isActive);
          const nextSprints =
            !hasActive && remaining.length > 0
              ? remaining.map((sp, i) => (i === 0 ? { ...sp, isActive: true } : sp))
              : remaining;
          return {
            ...s,
            sprints: nextSprints,
            tasks: s.tasks.filter((t) => t.sprintId !== sprintId),
          };
        }),
      toggleReportSection: (sectionId) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          return {
            ...s,
            reportSections: s.reportSections.map((r) =>
              r.id === sectionId && canManageArea(user, r.areaId)
                ? { ...r, completed: !r.completed }
                : r
            ),
          };
        }),
      addReportSection: (input) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canManageArea(user, input.areaId)) return s;
          return {
            ...s,
            reportSections: [
              ...s.reportSections,
              { id: uid("r"), completed: false, ...input },
            ],
          };
        }),
      setReportOverride: (areaId, value) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canManageArea(user, areaId)) return s;
          return {
            ...s,
            reportOverrides: { ...s.reportOverrides, [areaId]: value },
          };
        }),
      saveAreaNote: (input) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canViewPrivateArea(user, input.areaId)) return s;
          return {
            ...s,
            areaNotes: [
              {
                id: uid("an"),
                ...input,
                authorId: user.id,
                updatedAt: new Date().toISOString().slice(0, 10),
              },
              ...s.areaNotes,
            ],
          };
        }),
      deleteAreaNote: (noteId) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          const note = s.areaNotes.find((n) => n.id === noteId);
          if (!note || !canManageArea(user, note.areaId)) return s;
          return {
            ...s,
            areaNotes: s.areaNotes.filter((n) => n.id !== noteId),
          };
        }),
      createMeeting: (input) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          const allowed =
            input.type === "general"
              ? canApproveInMeeting(user)
              : Boolean(input.areaId && canManageArea(user, input.areaId));
          if (!allowed) return s;
          const id = uid("mt");
          const approvedMembers = s.members.filter(
            (m) =>
              m.accountStatus === "approved" &&
              (input.type === "general" || (input.areaId ? m.areaIds.includes(input.areaId) : false))
          );
          return {
            ...s,
            meetings: [{ id, ...input, createdBy: user.id }, ...s.meetings],
            attendance: [
              ...s.attendance,
              ...approvedMembers.map((m) => ({
                meetingId: id,
                memberId: m.id,
                status: "present" as AttendanceStatus,
              })),
            ],
          };
        }),
      setAttendance: (meetingId, memberId, status) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          const meeting = s.meetings.find((m) => m.id === meetingId);
          if (!meeting) return s;
          const allowed =
            meeting.type === "general"
              ? canApproveInMeeting(user)
              : Boolean(meeting.areaId && canManageArea(user, meeting.areaId));
          if (!allowed) return s;
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
        }),
      createAnnouncement: (input) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canManageAnnouncements(user)) return s;
          return {
            ...s,
            announcements: [
              {
                id: uid("ann"),
                ...input,
                authorId: user.id,
                createdAt: new Date().toISOString().slice(0, 10),
              },
              ...s.announcements,
            ],
          };
        }),
      togglePinAnnouncement: (id) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canManageAnnouncements(user)) return s;
          return {
            ...s,
            announcements: s.announcements.map((a) =>
              a.id === id ? { ...a, pinned: !a.pinned } : a
            ),
          };
        }),
      simulateSignup: (input) =>
        setState((s) => ({
          ...s,
          members: [
            ...s.members,
            {
              id: uid("m"),
              fullName: input.fullName,
              email: input.email,
              role: "calouro",
              accountStatus: "pending",
              requestedRole: input.requestedRole,
              areaIds: input.areaIds.length ? input.areaIds : ["aerodinamica"],
              directorAreaIds: [],
              createdAt: new Date().toISOString().slice(0, 10),
            },
          ],
        })),
      reviewMemberAccount: (input) =>
        setState((s) => {
          const user = s.members.find((m) => m.id === s.currentUserId) ?? s.members[0];
          if (!canApproveAccounts(user)) return s;
          return {
            ...s,
            members: s.members.map((m) =>
              m.id === input.memberId
                ? {
                    ...m,
                    accountStatus: input.approved ? "approved" : "rejected",
                    role: input.role,
                    areaIds: input.areaIds,
                    directorAreaIds: input.role === "diretor" ? input.directorAreaIds : [],
                  }
                : m
            ),
          };
        }),
    }),
    [state, currentUser]
  );

  return <ZeusContext.Provider value={value}>{children}</ZeusContext.Provider>;
}

export function useZeus() {
  const ctx = useContext(ZeusContext);
  if (!ctx) throw new Error("useZeus must be used within ZeusProvider");
  return ctx;
}
