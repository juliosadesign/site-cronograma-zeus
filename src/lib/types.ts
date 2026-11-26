export type Role =
  | "desenvolvedor"
  | "capitao"
  | "cocapitao"
  | "diretor"
  | "efetivado"
  | "calouro";

export type AreaCategory = "technical" | "corporate";
export type AreaRole = "diretor" | "efetivado" | "calouro";

export interface AreaMembership {
  areaId: string;
  role: AreaRole;
}

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
export type TaskCommentKind = "comment" | "rejection" | "blocker" | "approval";

export type FinancialKind = "income" | "expense";
export type FinancialStatus = "paid" | "pending";
export type MarketingKind = "post" | "sponsor" | "event" | "media";
export type MarketingStatus = "planned" | "in_progress" | "published" | "closed";
export type AircraftRevisionStatus = "draft" | "frozen" | "competition";

export interface LabSlot {
  day: number; // 0 = Dom .. 6 = Sab
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface NotificationConfig {
  discordWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  autoNotifyAnnouncements?: boolean;
  autoNotifyApprovals?: boolean;
  autoNotifyBlockers?: boolean;
}

export interface Area {
  id: string;
  name: string;
  shortCode: string;
  description: string;
  category: AreaCategory;
  colorHex: string;
  chipClass: string;
  borderClass: string;
  dotClass: string;
  bgTintClass: string;
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
  areaMemberships?: AreaMembership[];
  avatarUrl?: string;
  course?: string;
  bio?: string;
  inLabNow: boolean;
  labSchedule?: string;
  labSlots?: LabSlot[];
  isGhost?: boolean;
  roleConfirmed?: boolean;
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
  coAssigneeIds?: string[];
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
  blockedByAreaId?: string;
  blockedReason?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  kind: TaskCommentKind;
  createdAt: string;
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

export interface FinancialTransaction {
  id: string;
  seasonYear: number;
  kind: FinancialKind;
  status: FinancialStatus;
  category: string;
  areaId?: string;
  description: string;
  amountCents: number;
  transactionDate: string;
  receiptUrl?: string;
  createdBy?: string;
  createdAt: string;
}

export interface AreaBudget {
  areaId: string;
  seasonYear: number;
  plannedCents: number;
  notes: string;
}

export interface MarketingCampaign {
  id: string;
  seasonYear: number;
  kind: MarketingKind;
  title: string;
  partnerOrChannel: string;
  status: MarketingStatus;
  dueDate?: string;
  externalUrl?: string;
  notes: string;
  impactedAreaIds: string[];
  createdBy?: string;
  createdAt: string;
}

export interface TeamOKR {
  id: string;
  seasonYear: number;
  quarter: string;
  areaId?: string;
  title: string;
  keyResult: string;
  progress: number;
  ownerId?: string;
  createdAt: string;
}

export interface AircraftRevision {
  id: string;
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
  createdBy?: string;
  createdAt: string;
}

export type FeatureRequestPriority = "alta" | "media" | "baixa";
export type FeatureRequestStatus = "pendente" | "em_analise" | "planejado" | "entregue";

export interface AreaFeatureRequest {
  id: string;
  areaId: string;
  authorId: string;
  title: string;
  details: string;
  priority: FeatureRequestPriority;
  status: FeatureRequestStatus;
  devNotes: string;
  createdAt: string;
  updatedAt: string;
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
  taskComments: TaskComment[];
  reportSections: ReportSection[];
  reportOverrides: Record<string, number | null>;
  meetings: Meeting[];
  attendance: MeetingAttendance[];
  areaNotes: AreaNote[];
  areaFeatureRequests: AreaFeatureRequest[];
  ghostAllocations: Record<string, string>;
  announcements: Announcement[];
  archiveDocuments: ArchiveDocument[];
  flightChecklist: FlightChecklistItem[];
  competitionLessons: CompetitionLesson[];
  financialTransactions: FinancialTransaction[];
  areaBudgets: AreaBudget[];
  marketingCampaigns: MarketingCampaign[];
  teamOKRs: TeamOKR[];
  aircraftRevisions: AircraftRevision[];
}
