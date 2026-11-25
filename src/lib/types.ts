export type Role =
  | "desenvolvedor"
  | "capitao"
  | "cocapitao"
  | "diretor"
  | "efetivado"
  | "calouro";

export type AccountStatus = "pending" | "approved" | "rejected";
export type TaskStatus = "red" | "yellow" | "green";
export type Priority = "critical" | "high" | "medium" | "low";
export type AttendanceStatus = "present" | "absent" | "justified";
export type MeetingType = "general" | "area";
export type CalendarCategory = "competition" | "meeting" | "sprint" | "deadline";
export type AircraftConcept = "monoplano" | "biplano" | "asa_voadora";
export type SeasonYear = 2026 | 2027;
export type PeriodFilter = "all" | "q1" | "h1" | "q3" | "q4";
export type ArchiveDocType = "relatorio" | "planilha" | "cad" | "apresentacao" | "ata";
export type FlightCategory = "estrutural" | "aerodinamica" | "propulsao" | "cg_peso" | "seguranca";
export type LessonSeverity = "critico" | "alto" | "medio";

export interface LabSlot {
  day: number; // 0 = Dom .. 6 = Sab
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface NotificationConfig {
  discordWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
}

export interface Area {
  id: string;
  name: string;
  shortCode: string;
  description: string;
}

export interface Member {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  requestedRole: Role;
  areaIds: string[];
  directorAreaIds: string[];
  avatarUrl?: string;
  course?: string;
  bio?: string;
  inLabNow: boolean;
  labSchedule?: string;
  labSlots?: LabSlot[];
  createdAt: string;
}

export interface Sprint {
  id: string;
  seasonYear: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface SprintTask {
  id: string;
  sprintId: string;
  areaId: string;
  assigneeId: string;
  createdBy: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  directorValidated: boolean;
  directorValidatedBy?: string;
  meetingApproved: boolean;
  meetingApprovedBy?: string;
  externalUrl?: string;
  impactedAreaIds: string[];
  createdAt: string;
  approvedAt?: string;
}

export interface ReportSection {
  id: string;
  seasonYear: number;
  areaId: string;
  title: string;
  completed: boolean;
  impactedAreaIds: string[];
  externalUrl?: string;
  maxScore?: number;
  minScore?: number;
}

export interface Meeting {
  id: string;
  seasonYear: number;
  title: string;
  date: string;
  type: MeetingType;
  areaId?: string;
  createdBy: string;
}

export interface MeetingAttendance {
  meetingId: string;
  memberId: string;
  status: AttendanceStatus;
}

export interface AreaNote {
  id: string;
  areaId: string;
  authorId: string;
  title: string;
  content: string;
  externalUrl?: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  seasonYear: number;
  authorId: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  seasonYear: number;
  title: string;
  date: string;
  category: CalendarCategory;
  description?: string;
  areaId?: string;
}

export interface ArchiveDocument {
  id: string;
  seasonYear: number;
  areaId: string;
  title: string;
  docType: ArchiveDocType;
  externalUrl: string;
  summary: string;
  impactedAreaIds: string[];
  createdBy?: string;
  createdAt: string;
}

export interface FlightChecklistItem {
  id: string;
  seasonYear: number;
  category: FlightCategory;
  areaId?: string;
  title: string;
  critical: boolean;
  checked: boolean;
  notes: string;
}

export interface CompetitionLesson {
  id: string;
  seasonYear: number;
  areaId: string;
  severity: LessonSeverity;
  title: string;
  rootCause: string;
  preventionAction: string;
  resolved: boolean;
  impactedAreaIds: string[];
  createdBy?: string;
  createdAt: string;
}

export interface ZeusState {
  currentUserId: string;
  activeSeason: SeasonYear;
  competitionDate: string;
  calendarEvents: CalendarEvent[];
  conceptVotes: Record<string, AircraftConcept>;
  notificationConfig: NotificationConfig;
  members: Member[];
  sprints: Sprint[];
  tasks: SprintTask[];
  reportSections: ReportSection[];
  reportOverrides: Record<string, number | null>;
  meetings: Meeting[];
  attendance: MeetingAttendance[];
  areaNotes: AreaNote[];
  announcements: Announcement[];
  archiveDocuments: ArchiveDocument[];
  flightChecklist: FlightChecklistItem[];
  competitionLessons: CompetitionLesson[];
}
