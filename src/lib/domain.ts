import type {
  Area,
  MeetingAttendance,
  Member,
  Priority,
  ReportSection,
  Role,
  SprintTask,
  TaskStatus,
} from "./types";

export const ZEUS_AREAS: Area[] = [
  { id: "aerodinamica", name: "Aerodinâmica", shortCode: "AERO", description: "Perfis, asas, empenagem, CFD e arrasto." },
  { id: "cargas", name: "Cargas e Aeroelasticidade", shortCode: "CARG", description: "Envelope V-n, esforços e flutter." },
  { id: "estabilidade", name: "Estabilidade e Controle", shortCode: "ESTB", description: "CG, superfícies de comando e trimagem." },
  { id: "estruturas", name: "Estruturas", shortCode: "ESTR", description: "Longarinas, nervuras, compósitos e ensaios." },
  { id: "desempenho", name: "Desempenho", shortCode: "DESM", description: "Decolagem, subida, carga paga e pontuação." },
  { id: "eletrico", name: "Proj. Elétrico", shortCode: "ELET", description: "Motorização, bateria, fiação e telemetria." },
  { id: "marketing", name: "Marketing", shortCode: "MKT", description: "Marca, @equipezeusma, patrocínios e mídia." },
  { id: "plantas", name: "Plantas", shortCode: "PLAN", description: "Desenhos técnicos, vistas e pranchas SAE." },
  { id: "integracao", name: "Integração", shortCode: "INTG", description: "CAD master, encaixes, peso e balanceamento." },
  { id: "gestao", name: "Gestão", shortCode: "GEST", description: "Cronograma, sprints, pessoas e processos." },
  { id: "financeiro", name: "Financeiro", shortCode: "FIN", description: "Orçamentos, compras, caixa e prestação." },
];

export const ROLE_META: Record<Role, { label: string; badgeClass: string; rankOrder: number }> = {
  desenvolvedor: {
    label: "Desenvolvedor",
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
    rankOrder: 0,
  },
  capitao: {
    label: "Capitão",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35",
    rankOrder: 1,
  },
  cocapitao: {
    label: "Co-Capitão",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-200 border-amber-500/25",
    rankOrder: 2,
  },
  diretor: {
    label: "Diretor",
    badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    rankOrder: 3,
  },
  efetivado: {
    label: "Efetivado",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    rankOrder: 4,
  },
  calouro: {
    label: "Calouro",
    badgeClass: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
    rankOrder: 5,
  },
};

export const PRIORITY_META: Record<Priority, { label: string; eisenhower: string; points: number; badgeClass: string }> = {
  critical: {
    label: "Crítica",
    eisenhower: "Importante + Urgente",
    points: 4,
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
  },
  high: {
    label: "Alta",
    eisenhower: "Importante",
    points: 3,
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  medium: {
    label: "Média",
    eisenhower: "Urgente",
    points: 2,
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
  },
  low: {
    label: "Baixa",
    eisenhower: "Rotina",
    points: 1,
    badgeClass: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/25",
  },
};

export const TASK_STATUS_META: Record<TaskStatus, { label: string; dotClass: string; pillClass: string }> = {
  red: {
    label: "Não pronto",
    dotClass: "bg-rose-500",
    pillClass: "bg-rose-500/12 text-rose-600 dark:text-rose-300 border-rose-500/30",
  },
  yellow: {
    label: "Em processo",
    dotClass: "bg-amber-400",
    pillClass: "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  green: {
    label: "Feito",
    dotClass: "bg-emerald-500",
    pillClass: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
};

export function isTopLeadership(role: Role): boolean {
  return role === "desenvolvedor" || role === "capitao" || role === "cocapitao";
}

export function canApproveAccounts(user: Member): boolean {
  return user.accountStatus === "approved" && isTopLeadership(user.role);
}

export function canApproveInMeeting(user: Member): boolean {
  return user.accountStatus === "approved" && isTopLeadership(user.role);
}

export function canManageAnnouncements(user: Member): boolean {
  return user.accountStatus === "approved" && isTopLeadership(user.role);
}

export function canManageArea(user: Member, areaId: string): boolean {
  if (user.accountStatus !== "approved") return false;
  if (isTopLeadership(user.role)) return true;
  return user.role === "diretor" && user.directorAreaIds.includes(areaId);
}

export function canViewPrivateArea(user: Member, areaId: string): boolean {
  if (user.accountStatus !== "approved") return false;
  if (isTopLeadership(user.role)) return true;
  return user.areaIds.includes(areaId);
}

export function canUpdateTaskStatus(user: Member, task: SprintTask): boolean {
  if (user.accountStatus !== "approved") return false;
  return task.assigneeId === user.id || canManageArea(user, task.areaId);
}

export function computeMemberPoints(memberId: string, tasks: SprintTask[]): number {
  let total = 0;
  for (const task of tasks) {
    if (task.assigneeId === memberId && task.meetingApproved) {
      total += PRIORITY_META[task.priority].points;
    }
  }
  return total;
}

export function computeReportPercentage(
  areaId: string,
  sections: ReportSection[],
  manualOverride?: number | null
): number {
  if (manualOverride !== undefined && manualOverride !== null) {
    return Math.max(0, Math.min(100, Math.round(manualOverride)));
  }
  const areaSections = sections.filter((s) => s.areaId === areaId);
  if (areaSections.length === 0) return 0;
  const done = areaSections.filter((s) => s.completed).length;
  return Math.round((done / areaSections.length) * 100);
}

export function computeTeamReportPercentage(
  areas: Area[],
  sections: ReportSection[],
  overrides: Record<string, number | null> = {}
): { teamPercentage: number; byArea: Array<{ areaId: string; percentage: number }> } {
  const byArea = areas.map((a) => ({
    areaId: a.id,
    percentage: computeReportPercentage(a.id, sections, overrides[a.id] ?? null),
  }));
  const teamPercentage =
    byArea.length === 0
      ? 0
      : Math.round(byArea.reduce((sum, item) => sum + item.percentage, 0) / byArea.length);
  return { teamPercentage, byArea };
}

export function computeAttendanceStats(
  memberId: string,
  attendance: MeetingAttendance[]
): { present: number; absent: number; justified: number; total: number; rate: number } {
  const mine = attendance.filter((a) => a.memberId === memberId);
  const present = mine.filter((a) => a.status === "present").length;
  const absent = mine.filter((a) => a.status === "absent").length;
  const justified = mine.filter((a) => a.status === "justified").length;
  const total = mine.length;
  const rate = total === 0 ? 0 : Math.round((present / total) * 100);
  return { present, absent, justified, total, rate };
}

export function getAreaName(areaId: string): string {
  return ZEUS_AREAS.find((a) => a.id === areaId)?.name ?? areaId;
}

export function getAreaCode(areaId: string): string {
  return ZEUS_AREAS.find((a) => a.id === areaId)?.shortCode ?? areaId.toUpperCase();
}

export function getInitials(fullName: string): string {
  const parts = fullName
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "Z";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function computeDaysUntil(targetDateIso: string, fromDateIso?: string): number {
  const parseUtc = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return Date.UTC(y, (m || 1) - 1, d || 1);
  };
  const targetMs = parseUtc(targetDateIso);
  const fromMs = fromDateIso
    ? parseUtc(fromDateIso)
    : (() => {
        const now = new Date();
        return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      })();
  return Math.round((targetMs - fromMs) / 86_400_000);
}
