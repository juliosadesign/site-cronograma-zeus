import type {
  AircraftConcept,
  ArchiveDocument,
  Area,
  AreaRole,
  CompetitionLesson,
  FinancialTransaction,
  FlightChecklistItem,
  LabSlot,
  MeetingAttendance,
  Member,
  PeriodFilter,
  Priority,
  ReportSection,
  Role,
  SprintTask,
  TaskStatus,
} from "./types";

export const ZEUS_AREAS: Area[] = [
  {
    id: "aerodinamica",
    name: "Aerodinâmica",
    shortCode: "AERO",
    description: "Perfis, asas, empenagem, CFD e arrasto.",
    category: "technical",
    colorHex: "#38bdf8",
    chipClass: "border-sky-400/45 bg-sky-500/12 text-sky-600 dark:text-sky-300",
    borderClass: "border-sky-400/50",
    dotClass: "bg-sky-400",
    bgTintClass: "bg-sky-500/10",
  },
  {
    id: "cargas",
    name: "Cargas e Aeroelasticidade",
    shortCode: "CARG",
    description: "Envelope V-n, esforços e flutter.",
    category: "technical",
    colorHex: "#f43f5e",
    chipClass: "border-rose-400/45 bg-rose-500/12 text-rose-600 dark:text-rose-300",
    borderClass: "border-rose-400/50",
    dotClass: "bg-rose-500",
    bgTintClass: "bg-rose-500/10",
  },
  {
    id: "estabilidade",
    name: "Estabilidade e Controle",
    shortCode: "ESTB",
    description: "CG, superfícies de comando e trimagem.",
    category: "technical",
    colorHex: "#a78bfa",
    chipClass: "border-violet-400/45 bg-violet-500/12 text-violet-600 dark:text-violet-300",
    borderClass: "border-violet-400/50",
    dotClass: "bg-violet-400",
    bgTintClass: "bg-violet-500/10",
  },
  {
    id: "estruturas",
    name: "Estruturas",
    shortCode: "ESTR",
    description: "Longarinas, nervuras, compósitos e ensaios.",
    category: "technical",
    colorHex: "#f97316",
    chipClass: "border-orange-400/45 bg-orange-500/12 text-orange-600 dark:text-orange-300",
    borderClass: "border-orange-400/50",
    dotClass: "bg-orange-500",
    bgTintClass: "bg-orange-500/10",
  },
  {
    id: "desempenho",
    name: "Desempenho",
    shortCode: "DESM",
    description: "Decolagem, subida, carga paga e pontuação.",
    category: "technical",
    colorHex: "#34d399",
    chipClass: "border-emerald-400/45 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-400/50",
    dotClass: "bg-emerald-400",
    bgTintClass: "bg-emerald-500/10",
  },
  {
    id: "eletrico",
    name: "Proj. Elétrico",
    shortCode: "ELET",
    description: "Motorização, bateria, fiação e telemetria.",
    category: "technical",
    colorHex: "#facc15",
    chipClass: "border-yellow-400/45 bg-yellow-500/12 text-yellow-700 dark:text-yellow-300",
    borderClass: "border-yellow-400/50",
    dotClass: "bg-yellow-400",
    bgTintClass: "bg-yellow-500/10",
  },
  {
    id: "plantas",
    name: "Plantas",
    shortCode: "PLAN",
    description: "Desenhos técnicos, vistas e pranchas SAE.",
    category: "technical",
    colorHex: "#818cf8",
    chipClass: "border-indigo-400/45 bg-indigo-500/12 text-indigo-600 dark:text-indigo-300",
    borderClass: "border-indigo-400/50",
    dotClass: "bg-indigo-400",
    bgTintClass: "bg-indigo-500/10",
  },
  {
    id: "integracao",
    name: "Integração (PCP)",
    shortCode: "INTG",
    description: "PCP, CAD master, encaixes, peso e balanceamento.",
    category: "technical",
    colorHex: "#2dd4bf",
    chipClass: "border-teal-400/45 bg-teal-500/12 text-teal-700 dark:text-teal-300",
    borderClass: "border-teal-400/50",
    dotClass: "bg-teal-400",
    bgTintClass: "bg-teal-500/10",
  },
  {
    id: "marketing",
    name: "Marketing",
    shortCode: "MKT",
    description: "Marca, @equipezeusma, patrocínios e mídia.",
    category: "corporate",
    colorHex: "#e879f9",
    chipClass: "border-fuchsia-400/45 bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300",
    borderClass: "border-fuchsia-400/50",
    dotClass: "bg-fuchsia-400",
    bgTintClass: "bg-fuchsia-500/10",
  },
  {
    id: "gestao",
    name: "Gestão",
    shortCode: "GEST",
    description: "Cronograma, sprints, pessoas e processos.",
    category: "corporate",
    colorHex: "#60a5fa",
    chipClass: "border-blue-400/45 bg-blue-500/12 text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-400/50",
    dotClass: "bg-blue-400",
    bgTintClass: "bg-blue-500/10",
  },
  {
    id: "financeiro",
    name: "Financeiro",
    shortCode: "FIN",
    description: "Orçamentos, compras, caixa e prestação.",
    category: "corporate",
    colorHex: "#a3e635",
    chipClass: "border-lime-400/45 bg-lime-500/12 text-lime-700 dark:text-lime-300",
    borderClass: "border-lime-400/50",
    dotClass: "bg-lime-400",
    bgTintClass: "bg-lime-500/10",
  },
];

export const TECHNICAL_AREAS: Area[] = ZEUS_AREAS.filter((a) => a.category === "technical");
export const CORPORATE_AREAS: Area[] = ZEUS_AREAS.filter((a) => a.category === "corporate");

export const AREA_ROLE_META: Record<AreaRole, { label: string; badgeClass: string }> = {
  diretor: {
    label: "Diretor da Área",
    badgeClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
  efetivado: {
    label: "Efetivado",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  calouro: {
    label: "Calouro",
    badgeClass: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
  },
};

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

export const PRIORITY_META: Record<Priority, { label: string; eisenhower: string; badgeClass: string }> = {
  critical: {
    label: "Crítica",
    eisenhower: "Importante + Urgente",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
  },
  high: {
    label: "Alta",
    eisenhower: "Importante",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  medium: {
    label: "Média",
    eisenhower: "Urgente",
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
  },
  low: {
    label: "Baixa",
    eisenhower: "Rotina",
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

export function getAreaMeta(areaId: string): Area {
  return (
    ZEUS_AREAS.find((a) => a.id === areaId) ?? {
      id: areaId,
      name: areaId,
      shortCode: areaId.toUpperCase().slice(0, 4),
      description: "",
      category: "technical",
      colorHex: "#38bdf8",
      chipClass: "border-sky-400/45 bg-sky-500/12 text-sky-300",
      borderClass: "border-sky-400/50",
      dotClass: "bg-sky-400",
      bgTintClass: "bg-sky-500/10",
    }
  );
}

/** Builds full-square tinted background, 4-sided border and glow from any hex color. */
export function buildTintedCardStyle(
  colorHex: string,
  options?: { active?: boolean; emphasis?: "strong" | "medium" | "subtle" }
): { background: string; borderColor: string; boxShadow: string } {
  const emphasis = options?.emphasis ?? "strong";
  const active = Boolean(options?.active);

  if (emphasis === "subtle") {
    return {
      background: `linear-gradient(160deg, ${colorHex}1a 0%, ${colorHex}08 55%, transparent 100%)`,
      borderColor: `${colorHex}66`,
      boxShadow: `inset 0 1px 0 ${colorHex}33`,
    };
  }

  if (emphasis === "medium") {
    return active
      ? {
          background: `linear-gradient(135deg, ${colorHex}36 0%, ${colorHex}1c 100%)`,
          borderColor: `${colorHex}ee`,
          boxShadow: `0 0 0 1px ${colorHex}99, inset 0 1px 0 ${colorHex}55`,
        }
      : {
          background: `linear-gradient(135deg, ${colorHex}22 0%, ${colorHex}10 65%, ${colorHex}08 100%)`,
          borderColor: `${colorHex}78`,
          boxShadow: `inset 0 1px 0 ${colorHex}38`,
        };
  }

  return active
    ? {
        background: `linear-gradient(135deg, ${colorHex}42 0%, ${colorHex}24 55%, ${colorHex}14 100%)`,
        borderColor: colorHex,
        boxShadow: `0 0 0 1px ${colorHex}cc, 0 10px 26px -8px ${colorHex}55, inset 0 1px 0 ${colorHex}66`,
      }
    : {
        background: `linear-gradient(135deg, ${colorHex}30 0%, ${colorHex}18 60%, ${colorHex}0e 100%)`,
        borderColor: `${colorHex}99`,
        boxShadow: `inset 0 1px 0 ${colorHex}45, 0 4px 14px -8px ${colorHex}38`,
      };
}

/** Returns full-card tinted style mapped to the area's unique colorHex. */
export function getAreaCardStyle(
  areaId: string,
  options?: { active?: boolean; emphasis?: "strong" | "medium" | "subtle" }
): { background: string; borderColor: string; boxShadow: string } {
  return buildTintedCardStyle(getAreaMeta(areaId).colorHex, options);
}

export function getMemberAreaRole(member: Member, areaId: string): AreaRole | null {
  const fromMemberships = member.areaMemberships?.find((m) => m.areaId === areaId);
  if (fromMemberships) return fromMemberships.role;
  if (member.directorAreaIds.includes(areaId)) return "diretor";
  if (member.areaIds.includes(areaId)) {
    return member.role === "calouro" ? "calouro" : "efetivado";
  }
  return null;
}

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
  if (user.directorAreaIds.includes(areaId)) return true;
  return Boolean(user.areaMemberships?.some((m) => m.areaId === areaId && m.role === "diretor"));
}

export function canViewPrivateArea(user: Member, areaId: string): boolean {
  if (user.accountStatus !== "approved") return false;
  if (isTopLeadership(user.role)) return true;
  return (
    user.areaIds.includes(areaId) ||
    Boolean(user.areaMemberships?.some((m) => m.areaId === areaId))
  );
}

export function canAccessFinance(user: Member): boolean {
  return canViewPrivateArea(user, "financeiro");
}

export function canManageFinance(user: Member): boolean {
  return canViewPrivateArea(user, "financeiro");
}

export function canManageMarketing(user: Member): boolean {
  return canViewPrivateArea(user, "marketing");
}

export function canManageGestao(user: Member): boolean {
  return canViewPrivateArea(user, "gestao");
}

export function isMemberAssignedToTask(memberId: string, task: SprintTask): boolean {
  if (!memberId) return false;
  return task.assigneeId === memberId || Boolean(task.coAssigneeIds?.includes(memberId));
}

export function canUpdateTaskStatus(user: Member, task: SprintTask): boolean {
  if (user.accountStatus !== "approved") return false;
  return isMemberAssignedToTask(user.id, task) || canManageArea(user, task.areaId);
}

export function getReportOverrideKey(seasonYear: number, areaId: string): string {
  return `${seasonYear}:${areaId}`;
}

export function getReportOverride(
  overrides: Record<string, number | null>,
  seasonYear: number,
  areaId: string
): number | null {
  const seasonKey = getReportOverrideKey(seasonYear, areaId);
  if (seasonKey in overrides) return overrides[seasonKey] ?? null;
  if (seasonYear === 2026 && areaId in overrides) return overrides[areaId] ?? null;
  return null;
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
  overrides: Record<string, number | null> = {},
  seasonYear?: number
): { teamPercentage: number; byArea: Array<{ areaId: string; percentage: number }> } {
  const byArea = areas.map((a) => {
    const manual =
      seasonYear !== undefined
        ? getReportOverride(overrides, seasonYear, a.id)
        : (overrides[a.id] ?? null);
    return {
      areaId: a.id,
      percentage: computeReportPercentage(a.id, sections, manual),
    };
  });
  const teamPercentage =
    byArea.length === 0
      ? 0
      : Math.round(byArea.reduce((sum, item) => sum + item.percentage, 0) / byArea.length);
  return { teamPercentage, byArea };
}

export function computeFinanceSummary(transactions: FinancialTransaction[]): {
  incomePaidCents: number;
  expensePaidCents: number;
  balanceCents: number;
  pendingIncomeCents: number;
  pendingExpenseCents: number;
} {
  let incomePaidCents = 0;
  let expensePaidCents = 0;
  let pendingIncomeCents = 0;
  let pendingExpenseCents = 0;

  for (const tx of transactions) {
    if (tx.kind === "income") {
      if (tx.status === "paid") incomePaidCents += tx.amountCents;
      else pendingIncomeCents += tx.amountCents;
    } else {
      if (tx.status === "paid") expensePaidCents += tx.amountCents;
      else pendingExpenseCents += tx.amountCents;
    }
  }

  return {
    incomePaidCents,
    expensePaidCents,
    balanceCents: incomePaidCents - expensePaidCents,
    pendingIncomeCents,
    pendingExpenseCents,
  };
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

export function computeForecastTarget(
  daysBeforeCompetition: number,
  seasonTotalDays = 365
): number {
  const clampedDays = Math.max(0, Math.min(seasonTotalDays, daysBeforeCompetition));
  const progress = 1 - clampedDays / Math.max(1, seasonTotalDays);
  const smooth = progress * progress * (3 - 2 * progress);
  return Math.round(5 + 95 * (0.45 * progress + 0.55 * smooth));
}

export function evaluateScheduleHealth(
  actualPct: number,
  daysRemaining: number,
  seasonTotalDays = 365
): {
  targetPct: number;
  delta: number;
  status: "ahead" | "on_track" | "behind";
  label: string;
} {
  const targetPct = computeForecastTarget(daysRemaining, seasonTotalDays);
  const delta = Math.round(actualPct - targetPct);
  if (delta >= 3) {
    return { targetPct, delta, status: "ahead", label: "Adiantada" };
  }
  if (delta >= -5) {
    return { targetPct, delta, status: "on_track", label: "No prazo" };
  }
  return { targetPct, delta, status: "behind", label: "Atrasada" };
}

export function projectTeamProgressAt(
  actualPct: number,
  currentDaysRemaining: number,
  targetDaysBefore: number,
  seasonTotalDays = 365
): number {
  const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  if (targetDaysBefore === currentDaysRemaining) return clampPct(actualPct);
  const currentTarget = Math.max(1, computeForecastTarget(currentDaysRemaining, seasonTotalDays));
  const futureTarget = computeForecastTarget(targetDaysBefore, seasonTotalDays);
  if (targetDaysBefore > currentDaysRemaining) {
    return clampPct((futureTarget / currentTarget) * actualPct);
  }
  const paceRatio = Math.max(0.45, Math.min(1.35, actualPct / currentTarget));
  return clampPct(actualPct + (futureTarget - currentTarget) * paceRatio);
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isWithinLabSlots(
  slots: LabSlot[] | undefined,
  dayOfWeek: number,
  minutesFromMidnight: number
): boolean {
  if (!slots || slots.length === 0) return false;
  return slots.some((slot) => {
    if (slot.day !== dayOfWeek) return false;
    const start = parseMinutes(slot.start);
    const end = parseMinutes(slot.end);
    return minutesFromMidnight >= start && minutesFromMidnight <= end;
  });
}

export function getMemberLabStatus(
  member: Member,
  dayOfWeek: number,
  minutesFromMidnight: number
): "checked_in" | "scheduled" | "away" {
  if (member.inLabNow) return "checked_in";
  if (isWithinLabSlots(member.labSlots, dayOfWeek, minutesFromMidnight)) {
    return "scheduled";
  }
  return "away";
}

export function computeProjectedReportScore(
  sections: ReportSection[],
  areaId?: string
): { earned: number; max: number; percentage: number } {
  const target = areaId ? sections.filter((s) => s.areaId === areaId) : sections;
  let earned = 0;
  let max = 0;
  for (const s of target) {
    const pts = typeof s.maxScore === "number" && s.maxScore >= 0 ? s.maxScore : 10;
    max += pts;
    if (s.completed) earned += pts;
  }
  const percentage = max === 0 ? 0 : Math.round((earned / max) * 100);
  return { earned, max, percentage };
}

export interface AreaGraphEdge {
  from: string;
  to: string;
  weight: number;
  criticalCount: number;
  items: Array<{
    id: string;
    title: string;
    kind: "task" | "report" | "archive" | "lesson";
    priority?: Priority;
  }>;
}

export function isDateInPeriod(dateIso: string, period: PeriodFilter): boolean {
  if (period === "all") return true;
  const month = Number(dateIso.slice(5, 7));
  if (!month || Number.isNaN(month)) return true;
  if (period === "q1") return month >= 1 && month <= 3;
  if (period === "h1") return month >= 1 && month <= 6;
  if (period === "q3") return month >= 7 && month <= 9;
  return month >= 10 && month <= 12;
}

export interface ParsedDateRange {
  startIso: string;
  endIso: string;
  label: string;
}

const MONTH_NAMES_PT: Array<{ month: number; label: string; tokens: string[] }> = [
  { month: 1, label: "Jan", tokens: ["janeiro", "jan"] },
  { month: 2, label: "Fev", tokens: ["fevereiro", "fev"] },
  { month: 3, label: "Mar", tokens: ["marco", "março", "mar"] },
  { month: 4, label: "Abr", tokens: ["abril", "abr"] },
  { month: 5, label: "Mai", tokens: ["maio", "mai"] },
  { month: 6, label: "Jun", tokens: ["junho", "jun"] },
  { month: 7, label: "Jul", tokens: ["julho", "jul"] },
  { month: 8, label: "Ago", tokens: ["agosto", "ago"] },
  { month: 9, label: "Set", tokens: ["setembro", "set"] },
  { month: 10, label: "Out", tokens: ["outubro", "out"] },
  { month: 11, label: "Nov", tokens: ["novembro", "nov"] },
  { month: 12, label: "Dez", tokens: ["dezembro", "dez"] },
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function buildValidDay(year: number, month: number, day: number): ParsedDateRange | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  const iso = `${year}-${pad2(month)}-${pad2(day)}`;
  return {
    startIso: iso,
    endIso: iso,
    label: `${pad2(day)}/${pad2(month)}/${year}`,
  };
}

function buildValidMonth(year: number, month: number): ParsedDateRange | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  const monthMeta = MONTH_NAMES_PT[month - 1];
  return {
    startIso: `${year}-${pad2(month)}-01`,
    endIso: `${year}-${pad2(month)}-${pad2(maxDay)}`,
    label: `${monthMeta?.label ?? pad2(month)}/${year}`,
  };
}

function normalizeYearToken(rawYear: string): number {
  const n = Number(rawYear);
  if (rawYear.length === 2) return 2000 + n;
  return n;
}

/** Formats YYYY-MM-DD (or ISO timestamp) to DD/MM/YYYY for UI display. */
export function formatIsoToBr(iso?: string | null): string {
  if (!iso) return "";
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * Parses flexible typed dates in Portuguese or ISO formats:
 * - DD/MM/YYYY, DD-MM-YYYY, DD/MM, YYYY-MM-DD (single day)
 * - MM/YYYY, MM/YY, YYYY-MM, "março", "mar 2026", "abril/26" (full month)
 * - YYYY (full year)
 */
export function parseFlexibleDateInput(raw: string, defaultYear = 2026): ParsedDateRange | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  const normalized = cleaned
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "hoje") {
    const now = new Date();
    return buildValidDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  // ISO day: YYYY-MM-DD or YYYY/MM/DD
  let match = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    return buildValidDay(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  // BR day: DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  match = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/);
  if (match) {
    return buildValidDay(normalizeYearToken(match[3]), Number(match[2]), Number(match[1]));
  }

  // Short BR day/month: DD/MM or DD-MM
  match = normalized.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    // Heuristic: if second >= 24 and first <= 12, treat as MM/YY (e.g. 04/26 -> abril/2026)
    if (second >= 24 && second <= 99 && first >= 1 && first <= 12) {
      return buildValidMonth(2000 + second, first);
    }
    return buildValidDay(defaultYear, second, first);
  }

  // ISO month: YYYY-MM or YYYY/MM
  match = normalized.match(/^(\d{4})[-/](\d{1,2})$/);
  if (match) {
    return buildValidMonth(Number(match[1]), Number(match[2]));
  }

  // Numeric MM/YYYY or MM-YYYY
  match = normalized.match(/^(\d{1,2})[-/](\d{4})$/);
  if (match) {
    return buildValidMonth(Number(match[2]), Number(match[1]));
  }

  // Year only: YYYY
  match = normalized.match(/^(\d{4})$/);
  if (match) {
    const y = Number(match[1]);
    if (y >= 2000 && y <= 2100) {
      return { startIso: `${y}-01-01`, endIso: `${y}-12-31`, label: String(y) };
    }
    return null;
  }

  // Portuguese month names: "marco", "mar 2026", "marco de 2026", "abr/26"
  const monthText = normalized.replace(/\s+de\s+/g, " ").replace(/[-/]/g, " ");
  const parts = monthText.split(/\s+/).filter(Boolean);
  if (parts.length >= 1 && parts.length <= 2) {
    const monthEntry = MONTH_NAMES_PT.find((item) => item.tokens.includes(parts[0]));
    if (monthEntry) {
      if (parts.length === 1) {
        return buildValidMonth(defaultYear, monthEntry.month);
      }
      if (/^(\d{2}|\d{4})$/.test(parts[1])) {
        return buildValidMonth(normalizeYearToken(parts[1]), monthEntry.month);
      }
    }
  }

  return null;
}

/** Checks if an item [itemStart, itemEnd] overlaps [filterStart, filterEnd] using ISO YYYY-MM-DD strings. */
export function doesDateRangeOverlap(
  itemStart?: string | null,
  itemEnd?: string | null,
  filterStart?: string | null,
  filterEnd?: string | null
): boolean {
  const fStart = filterStart ? filterStart.slice(0, 10) : "";
  const fEnd = filterEnd ? filterEnd.slice(0, 10) : "";
  if (!fStart && !fEnd) return true;

  const rawStart = itemStart ? itemStart.slice(0, 10) : "";
  const rawEnd = itemEnd ? itemEnd.slice(0, 10) : "";
  const iStart = rawStart || rawEnd;
  const iEnd = rawEnd || rawStart;

  if (!iStart || !iEnd) return false;
  if (fStart && iEnd < fStart) return false;
  if (fEnd && iStart > fEnd) return false;
  return true;
}

export function computeFlightReadiness(items: FlightChecklistItem[]): {
  checked: number;
  total: number;
  criticalPending: number;
  percentage: number;
} {
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  const criticalPending = items.filter((i) => i.critical && !i.checked).length;
  const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
  return { checked, total, criticalPending, percentage };
}

export function computeAreaGraphEdges(
  tasks: SprintTask[],
  sections: ReportSection[],
  archiveDocs: ArchiveDocument[] = [],
  lessons: CompetitionLesson[] = []
): AreaGraphEdge[] {
  const map = new Map<string, AreaGraphEdge>();
  const ensure = (from: string, to: string) => {
    const key = `${from}->${to}`;
    let edge = map.get(key);
    if (!edge) {
      edge = { from, to, weight: 0, criticalCount: 0, items: [] };
      map.set(key, edge);
    }
    return edge;
  };

  for (const t of tasks) {
    for (const to of t.impactedAreaIds) {
      if (to === t.areaId) continue;
      const edge = ensure(t.areaId, to);
      edge.weight += 1;
      if (t.priority === "critical" || t.priority === "high") edge.criticalCount += 1;
      edge.items.push({ id: t.id, title: t.title, kind: "task", priority: t.priority });
    }
  }

  for (const r of sections) {
    for (const to of r.impactedAreaIds) {
      if (to === r.areaId) continue;
      const edge = ensure(r.areaId, to);
      edge.weight += 1;
      edge.items.push({ id: r.id, title: r.title, kind: "report" });
    }
  }

  for (const doc of archiveDocs) {
    for (const to of doc.impactedAreaIds) {
      if (to === doc.areaId) continue;
      const edge = ensure(doc.areaId, to);
      edge.weight += 1;
      edge.items.push({ id: doc.id, title: doc.title, kind: "archive" });
    }
  }

  for (const les of lessons) {
    for (const to of les.impactedAreaIds) {
      if (to === les.areaId) continue;
      const edge = ensure(les.areaId, to);
      edge.weight += 1;
      if (les.severity === "critico") edge.criticalCount += 1;
      edge.items.push({ id: les.id, title: les.title, kind: "lesson" });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.weight - a.weight);
}

export function computeConceptVoteTally(
  votes: Record<string, AircraftConcept>
): Record<AircraftConcept, number> {
  const tally: Record<AircraftConcept, number> = {
    monoplano: 0,
    biplano: 0,
    asa_voadora: 0,
  };
  for (const choice of Object.values(votes)) {
    if (choice in tally) tally[choice] += 1;
  }
  return tally;
}
