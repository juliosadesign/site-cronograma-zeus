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
  evaluateScheduleHealth,
  getAreaCardStyle,
  getAreaMeta,
  getInitials,
  getMemberAreaRole,
  getMemberLabStatus,
  getReportOverride,
  getReportOverrideKey,
  isDateInPeriod,
  isWithinLabSlots,
  projectTeamProgressAt,
  TECHNICAL_AREAS,
  ZEUS_AREAS,
} from "../domain.ts";
import type { FinancialTransaction, Member, MeetingAttendance, ReportSection, SprintTask } from "../types.ts";

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

console.log("All Zeus domain & RBAC tests passed!");
