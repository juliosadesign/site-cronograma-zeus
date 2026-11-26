import assert from "node:assert/strict";
import {
  buildTintedCardStyle,
  canAccessFinance,
  canApproveAccounts,
  canApproveInMeeting,
  canManageArea,
  canUpdateTaskStatus,
  canViewPrivateArea,
  computeAreaGraphEdges,
  computeAttendanceStats,
  computeConceptVoteTally,
  computeDaysUntil,
  computeFinanceSummary,
  computeFlightReadiness,
  computeForecastTarget,
  computeMemberPoints,
  computeProjectedReportScore,
  computeReportPercentage,
  computeTeamReportPercentage,
  CORPORATE_AREAS,
  doesDateRangeOverlap,
  evaluateScheduleHealth,
  formatIsoToBr,
  getAreaCardStyle,
  getAreaMeta,
  getInitials,
  getMemberAreaRole,
  getMemberLabStatus,
  getReportOverride,
  getReportOverrideKey,
  isDateInPeriod,
  isWithinLabSlots,
  parseFlexibleDateInput,
  projectTeamProgressAt,
  TECHNICAL_AREAS,
  ZEUS_AREAS,
} from "../domain.ts";
import {
  applyGhostMembersOverlay,
  doesTaskCitationMatchGhost,
  getUnallocatedGhosts,
  GHOST_TEAM_ROSTER,
  isGhostMemberId,
} from "../ghost-members.ts";
import type { FinancialTransaction, Member, MeetingAttendance, ReportSection, SprintTask, ZeusState } from "../types.ts";

assert.equal(ZEUS_AREAS.length, 11, "Deve conter exatamente 11 áreas da Zeus AeroDesign");
assert.equal(TECHNICAL_AREAS.length, 8, "Devem existir 8 áreas técnicas");
assert.equal(CORPORATE_AREAS.length, 3, "Devem existir 3 áreas corporativas (MKT, GEST, FIN)");

const uniqueColors = new Set(ZEUS_AREAS.map((a) => a.colorHex));
assert.equal(uniqueColors.size, 11, "Cada uma das 11 áreas deve possuir uma cor única");
assert.equal(getAreaMeta("financeiro").colorHex, "#a3e635");

const dev: Member = {
  id: "dev",
  fullName: "Júlio",
  email: "julio@zeus.br",
  role: "desenvolvedor",
  accountStatus: "approved",
  requestedRole: "desenvolvedor",
  areaIds: ["integracao"],
  directorAreaIds: [],
  inLabNow: true,
  createdAt: "2026-01-01",
};

const capitao: Member = { ...dev, id: "cap", role: "capitao", areaIds: ["gestao"] };
const diretorAero: Member = {
  ...dev,
  id: "dir",
  role: "diretor",
  areaIds: ["aerodinamica", "desempenho"],
  directorAreaIds: ["aerodinamica"],
  areaMemberships: [
    { areaId: "aerodinamica", role: "diretor" },
    { areaId: "desempenho", role: "efetivado" },
  ],
};
const multiRoleMember: Member = {
  ...dev,
  id: "multi",
  role: "efetivado",
  areaIds: ["estruturas", "marketing"],
  directorAreaIds: ["estruturas"],
  areaMemberships: [
    { areaId: "estruturas", role: "diretor" },
    { areaId: "marketing", role: "efetivado" },
  ],
};
const calouroAero: Member = { ...dev, id: "cal", role: "calouro", areaIds: ["aerodinamica"], directorAreaIds: [] };
const finMember: Member = {
  ...dev,
  id: "fin",
  role: "efetivado",
  areaIds: ["financeiro"],
  directorAreaIds: [],
  areaMemberships: [{ areaId: "financeiro", role: "efetivado" }],
};

// RBAC: Desenvolvedor & Capitão têm acesso total e aprovam contas/reuniões
assert.equal(canApproveAccounts(dev), true);
assert.equal(canApproveInMeeting(dev), true);
assert.equal(canViewPrivateArea(dev, "financeiro"), true);
assert.equal(canManageArea(dev, "estruturas"), true);
assert.equal(canApproveAccounts(capitao), true);
assert.equal(canAccessFinance(dev), true);

// RBAC: Diretor + multi-papel por área
assert.equal(canApproveAccounts(diretorAero), false);
assert.equal(canApproveInMeeting(diretorAero), false);
assert.equal(canManageArea(diretorAero, "aerodinamica"), true);
assert.equal(canManageArea(diretorAero, "desempenho"), false);
assert.equal(canViewPrivateArea(diretorAero, "desempenho"), true);
assert.equal(canViewPrivateArea(diretorAero, "estruturas"), false);
assert.equal(getMemberAreaRole(diretorAero, "aerodinamica"), "diretor");
assert.equal(getMemberAreaRole(diretorAero, "desempenho"), "efetivado");

assert.equal(canManageArea(multiRoleMember, "estruturas"), true, "Diretor em estruturas mesmo com patente global efetivado");
assert.equal(canManageArea(multiRoleMember, "marketing"), false, "Apenas efetivado em marketing");
assert.equal(canAccessFinance(multiRoleMember), false, "Sem acesso ao Financeiro");
assert.equal(canAccessFinance(finMember), true, "Membro do Financeiro acessa Financeiro");

// RBAC: Calouro vê privado apenas da própria área
assert.equal(canViewPrivateArea(calouroAero, "aerodinamica"), true);
assert.equal(canViewPrivateArea(calouroAero, "financeiro"), false);
assert.equal(canAccessFinance(calouroAero), false);

// Ranking ponderado: somente tarefas com meetingApproved === true contam pontos
const tasks: SprintTask[] = [
  {
    id: "t1", sprintId: "s1", areaId: "aerodinamica", assigneeId: "cal", createdBy: "dir",
    title: "A", description: "", priority: "critical", status: "green",
    directorValidated: true, meetingApproved: true, impactedAreaIds: [], createdAt: "2026-01-01",
  },
  {
    id: "t2", sprintId: "s1", areaId: "aerodinamica", assigneeId: "cal", createdBy: "dir",
    title: "B", description: "", priority: "high", status: "green",
    directorValidated: true, meetingApproved: false, impactedAreaIds: [], createdAt: "2026-01-01",
  },
  {
    id: "t3", sprintId: "s1", areaId: "aerodinamica", assigneeId: "cal", createdBy: "dir",
    title: "C", description: "", priority: "medium", status: "green",
    directorValidated: true, meetingApproved: true, impactedAreaIds: [], createdAt: "2026-01-01",
  },
];
assert.equal(computeMemberPoints("cal", tasks), 6, "4 (crítica) + 2 (média) = 6; tarefa não aprovada em reunião não conta");
assert.equal(canUpdateTaskStatus(calouroAero, tasks[0]), true);
assert.equal(canUpdateTaskStatus(diretorAero, tasks[0]), true);

// Relatórios: cálculo automático e override manual isolado por temporada
const sections: ReportSection[] = [
  { id: "r1", seasonYear: 2026, areaId: "aerodinamica", title: "1", completed: true, impactedAreaIds: [] },
  { id: "r2", seasonYear: 2026, areaId: "aerodinamica", title: "2", completed: true, impactedAreaIds: [] },
  { id: "r3", seasonYear: 2026, areaId: "aerodinamica", title: "3", completed: false, impactedAreaIds: [] },
];
assert.equal(computeReportPercentage("aerodinamica", sections), 67);
assert.equal(computeReportPercentage("aerodinamica", sections, 85), 85);
assert.equal(computeReportPercentage("estruturas", sections), 0);

const teamReport = computeTeamReportPercentage(
  TECHNICAL_AREAS.slice(0, 2),
  sections,
  { [getReportOverrideKey(2026, "cargas")]: 50 },
  2026
);
assert.equal(teamReport.teamPercentage, 59, "Média entre 67% e 50% arredonda para 59%");
assert.equal(getReportOverride({ "2026:cargas": 50 }, 2027, "cargas"), null, "Override de 2026 não deve vazar para 2027");

// Financeiro summary
const txs: FinancialTransaction[] = [
  { id: "f1", seasonYear: 2026, kind: "income", status: "paid", category: "Patrocínio", description: "A", amountCents: 500000, transactionDate: "2026-03-01", createdAt: "2026-03-01" },
  { id: "f2", seasonYear: 2026, kind: "expense", status: "paid", category: "Compósitos", areaId: "estruturas", description: "B", amountCents: 180000, transactionDate: "2026-03-05", createdAt: "2026-03-05" },
  { id: "f3", seasonYear: 2026, kind: "expense", status: "pending", category: "Elétrica", areaId: "eletrico", description: "C", amountCents: 60000, transactionDate: "2026-03-10", createdAt: "2026-03-10" },
];
assert.deepEqual(computeFinanceSummary(txs), {
  incomePaidCents: 500000,
  expensePaidCents: 180000,
  balanceCents: 320000,
  pendingIncomeCents: 0,
  pendingExpenseCents: 60000,
});

// Presença
const att: MeetingAttendance[] = [
  { meetingId: "m1", memberId: "cal", status: "present" },
  { meetingId: "m2", memberId: "cal", status: "justified" },
  { meetingId: "m3", memberId: "cal", status: "absent" },
  { meetingId: "m4", memberId: "cal", status: "present" },
];
const stats = computeAttendanceStats("cal", att);
assert.deepEqual(stats, { present: 2, absent: 1, justified: 1, total: 4, rate: 50 });

assert.equal(computeDaysUntil("2026-12-04", "2026-11-24"), 10);
assert.equal(computeDaysUntil("2026-11-24", "2026-11-24"), 0);
assert.equal(computeDaysUntil("2026-11-20", "2026-11-24"), -4);
assert.equal(getInitials("Júlio (Dev)"), "JÚ");
assert.equal(getInitials("Lucas Mendes"), "LM");

// Previsao e metas S-curve
const t300 = computeForecastTarget(300);
const t200 = computeForecastTarget(200);
const t100 = computeForecastTarget(100);
const t30 = computeForecastTarget(30);
assert.ok(t300 < t200 && t200 < t100 && t100 < t30 && t30 <= 100, "S-curve deve crescer monotonicamente");
assert.equal(computeForecastTarget(0), 100);

assert.equal(evaluateScheduleHealth(70, 200).status, "ahead");
assert.equal(evaluateScheduleHealth(t200, 200).status, "on_track");
assert.equal(evaluateScheduleHealth(10, 200).status, "behind");

assert.ok(projectTeamProgressAt(55, 250, 100) >= 55);
assert.ok(projectTeamProgressAt(55, 250, 300) <= 55);

// V2: Lab slots, pontuacao projetada, grafo Obsidian e enquete conceitual
const slots = [{ day: 2, start: "14:00", end: "18:00" }];
assert.equal(isWithinLabSlots(slots, 2, 15 * 60), true);
assert.equal(isWithinLabSlots(slots, 2, 19 * 60), false);
assert.equal(getMemberLabStatus({ ...dev, inLabNow: true, labSlots: [] }, 2, 15 * 60), "checked_in");
assert.equal(getMemberLabStatus({ ...dev, inLabNow: false, labSlots: slots }, 2, 15 * 60), "scheduled");
assert.equal(getMemberLabStatus({ ...dev, inLabNow: false, labSlots: slots }, 1, 15 * 60), "away");

const scoredSections: ReportSection[] = [
  { id: "s1", seasonYear: 2026, areaId: "aerodinamica", title: "A", completed: true, impactedAreaIds: ["desempenho"], maxScore: 20 },
  { id: "s2", seasonYear: 2026, areaId: "aerodinamica", title: "B", completed: false, impactedAreaIds: ["cargas"], maxScore: 10 },
];
assert.deepEqual(computeProjectedReportScore(scoredSections, "aerodinamica"), {
  earned: 20,
  max: 30,
  percentage: 67,
});

const edges = computeAreaGraphEdges(tasks, scoredSections);
assert.equal(edges.length, 2);
assert.equal(edges[0].from, "aerodinamica");

const tally = computeConceptVoteTally({ a: "monoplano", b: "asa_voadora", c: "monoplano" });
assert.deepEqual(tally, { monoplano: 2, biplano: 0, asa_voadora: 1 });

assert.equal(isDateInPeriod("2026-06-15", "h1"), true);
assert.equal(isDateInPeriod("2026-08-01", "h1"), false);
assert.equal(isDateInPeriod("2026-08-01", "q3"), true);

const flightStats = computeFlightReadiness([
  { id: "f1", seasonYear: 2026, category: "estrutural", title: "Longarina", critical: true, checked: true, notes: "" },
  { id: "f2", seasonYear: 2026, category: "seguranca", title: "Fail-safe", critical: true, checked: false, notes: "" },
]);
assert.deepEqual(flightStats, { checked: 1, total: 2, criticalPending: 1, percentage: 50 });

for (const area of ZEUS_AREAS) {
  for (const emphasis of ["strong", "medium", "subtle"] as const) {
    const baseStyle = getAreaCardStyle(area.id, { emphasis });
    const activeStyle = getAreaCardStyle(area.id, { active: true, emphasis });
    assert.ok(baseStyle.background.includes(area.colorHex), `${area.id} ${emphasis} background usa colorHex`);
    assert.ok(baseStyle.borderColor.includes(area.colorHex), `${area.id} ${emphasis} border usa colorHex`);
    assert.ok(baseStyle.boxShadow.includes(area.colorHex), `${area.id} ${emphasis} shadow usa colorHex`);
    assert.ok(activeStyle.background.includes(area.colorHex), `${area.id} ${emphasis} active background usa colorHex`);
    assert.ok(activeStyle.borderColor.includes(area.colorHex), `${area.id} ${emphasis} active border usa colorHex`);
    assert.ok(activeStyle.boxShadow.includes(area.colorHex), `${area.id} ${emphasis} active shadow usa colorHex`);
  }
}
const customTint = buildTintedCardStyle("#f59e0b", { active: true, emphasis: "strong" });
assert.equal(customTint.borderColor, "#f59e0b");

// Flexible date parsing & overlap tests
assert.deepEqual(parseFlexibleDateInput("15/03/2026"), {
  startIso: "2026-03-15",
  endIso: "2026-03-15",
  label: "15/03/2026",
});
assert.deepEqual(parseFlexibleDateInput("2026-04-05"), {
  startIso: "2026-04-05",
  endIso: "2026-04-05",
  label: "05/04/2026",
});
assert.deepEqual(parseFlexibleDateInput("12/08", 2026), {
  startIso: "2026-08-12",
  endIso: "2026-08-12",
  label: "12/08/2026",
});
assert.deepEqual(parseFlexibleDateInput("03/2026"), {
  startIso: "2026-03-01",
  endIso: "2026-03-31",
  label: "Mar/2026",
});
assert.deepEqual(parseFlexibleDateInput("março", 2026), {
  startIso: "2026-03-01",
  endIso: "2026-03-31",
  label: "Mar/2026",
});
assert.deepEqual(parseFlexibleDateInput("abr 2026"), {
  startIso: "2026-04-01",
  endIso: "2026-04-30",
  label: "Abr/2026",
});
assert.equal(parseFlexibleDateInput("31/02/2026"), null);
assert.equal(formatIsoToBr("2026-10-25"), "25/10/2026");

assert.equal(doesDateRangeOverlap("2026-03-01", "2026-03-15", "2026-03-10", "2026-03-20"), true);
assert.equal(doesDateRangeOverlap("2026-03-01", "2026-03-15", "2026-03-20", "2026-03-30"), false);

// Ghost members presentation overlay tests
const baseOverlayState: ZeusState = {
  currentUserId: dev.id,
  activeSeason: 2026,
  competitionDate: "2026-10-30",
  members: [
    dev,
    {
      ...diretorAero,
      id: "real-jodson",
      fullName: "Jodson Monteiro Pestana",
      areaIds: ["aerodinamica"],
    },
  ],
  sprints: [],
  tasks: [
    {
      id: "t-wm",
      sprintId: "sp1",
      areaId: "eletrico",
      assigneeId: "",
      createdBy: dev.id,
      title: "Dimensionamento de baterias",
      description: "Citação na planilha: W. Mateus",
      priority: "high",
      status: "red",
      directorValidated: false,
      meetingApproved: false,
      impactedAreaIds: [],
      createdAt: "2026-03-01",
    },
    {
      id: "t-mat",
      sprintId: "sp1",
      areaId: "estruturas",
      assigneeId: "",
      createdBy: dev.id,
      title: "Longarina",
      description: "Citação na planilha: Mateus",
      priority: "medium",
      status: "yellow",
      directorValidated: false,
      meetingApproved: false,
      impactedAreaIds: [],
      createdAt: "2026-03-01",
    },
    {
      id: "t-shell",
      sprintId: "sp1",
      areaId: "desempenho",
      assigneeId: "",
      createdBy: dev.id,
      title: "Envelope de decolagem",
      description: "Citação na planilha: Shell",
      priority: "high",
      status: "green",
      directorValidated: false,
      meetingApproved: false,
      impactedAreaIds: [],
      createdAt: "2026-03-01",
    },
  ],
  reportSections: [],
  reportOverrides: {},
  meetings: [],
  attendance: [],
  areaNotes: [],
  areaFeatureRequests: [],
  ghostAllocations: {},
  announcements: [],
  calendarEvents: [],
  conceptVotes: {},
  taskComments: [],
  archiveDocuments: [],
  flightChecklist: [],
  competitionLessons: [],
  financialTransactions: [],
  areaBudgets: [],
  marketingCampaigns: [],
  teamOKRs: [],
  aircraftRevisions: [],
  notificationConfig: {
    autoNotifyAnnouncements: false,
    autoNotifyApprovals: false,
    autoNotifyBlockers: false,
  },
};

assert.equal(applyGhostMembersOverlay(baseOverlayState, false).members.length, 2);
const ghostEnabledState = applyGhostMembersOverlay(baseOverlayState, true);
assert.equal(
  ghostEnabledState.members.filter((m) => m.fullName === "Jodson Monteiro Pestana").length,
  1,
  "Não deve duplicar membro real já cadastrado com o mesmo nome"
);
const allanaGhost = ghostEnabledState.members.find(
  (m) => m.fullName === "Allana Mirelle Marques Menezes"
);
assert.ok(allanaGhost?.isGhost && isGhostMemberId(allanaGhost.id));
assert.equal(allanaGhost.email, "", "Fantasma não deve inventar email");
assert.deepEqual(allanaGhost.areaIds, [], "Fantasma sem área confirmada deve permanecer vazio");
assert.equal(allanaGhost.roleConfirmed, false);

const annaGhost = ghostEnabledState.members.find((m) => m.fullName === "Anna Clara Alves");
assert.deepEqual(annaGhost?.areaIds, ["eletrico", "plantas"]);
assert.equal(annaGhost?.roleConfirmed, true);

const rebecaGhost = ghostEnabledState.members.find((m) => m.id === "ghost-rebeca");
assert.equal(rebecaGhost?.role, "diretor");
assert.deepEqual(rebecaGhost?.directorAreaIds, ["plantas", "integracao"]);

const raisaGhost = ghostEnabledState.members.find((m) => m.id === "ghost-raisa");
assert.equal(raisaGhost?.role, "diretor");
assert.deepEqual(raisaGhost?.directorAreaIds, ["marketing", "financeiro", "gestao"]);

assert.equal(
  ghostEnabledState.tasks.find((t) => t.id === "t-wm")?.assigneeId,
  "ghost-wemerson",
  "W. Mateus deve vincular a Wemerson Mateus, não a Mateus Costa"
);
assert.equal(
  ghostEnabledState.tasks.find((t) => t.id === "t-mat")?.assigneeId,
  "ghost-mateus"
);
assert.equal(
  ghostEnabledState.tasks.find((t) => t.id === "t-shell")?.assigneeId,
  "ghost-richeldson",
  "Shell deve vincular a Richeldson em Desempenho"
);

const wemersonDef = GHOST_TEAM_ROSTER.find((g) => g.id === "ghost-wemerson")!;
const mateusDef = GHOST_TEAM_ROSTER.find((g) => g.id === "ghost-mateus")!;
assert.equal(doesTaskCitationMatchGhost(baseOverlayState.tasks[0], wemersonDef), true);
assert.equal(doesTaskCitationMatchGhost(baseOverlayState.tasks[0], mateusDef), false);
assert.equal(doesTaskCitationMatchGhost(baseOverlayState.tasks[1], mateusDef), true);

const allocatedState = applyGhostMembersOverlay(
  { ...baseOverlayState, ghostAllocations: { "ghost-anna-clara": dev.id } },
  true
);
assert.equal(
  allocatedState.members.some((m) => m.id === "ghost-anna-clara"),
  false,
  "Fantasma alocado a membro real não deve aparecer duplicado como fantasma"
);
assert.equal(
  getUnallocatedGhosts(baseOverlayState.members, { "ghost-anna-clara": dev.id }).some(
    (g) => g.id === "ghost-anna-clara"
  ),
  false
);

console.log("All Zeus domain & RBAC tests passed!");
