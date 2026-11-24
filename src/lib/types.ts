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
  createdAt: string;
}

export interface Sprint {
  id: string;
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
  authorId: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

export interface ZeusState {
  currentUserId: string;
  members: Member[];
  sprints: Sprint[];
  tasks: SprintTask[];
  reportSections: ReportSection[];
  reportOverrides: Record<string, number | null>;
  meetings: Meeting[];
  attendance: MeetingAttendance[];
  areaNotes: AreaNote[];
  announcements: Announcement[];
}
