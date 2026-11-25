import assert from "node:assert/strict";
import {
  canApproveAccounts,
  canApproveInMeeting,
  canManageArea,
  canUpdateTaskStatus,
  canViewPrivateArea,
  computeAttendanceStats,
  computeConceptVoteTally,
  computeDaysUntil,
  computeFlightReadiness,
  computeForecastTarget,
  computeMemberPoints,
  computeProjectedReportScore,
  computeReportPercentage,
  computeTeamReportPercentage,
  computeAreaGraphEdges,
  evaluateScheduleHealth,
  getInitials,
  getMemberLabStatus,
  isDateInPeriod,
  isWithinLabSlots,
  projectTeamProgressAt,
  ZEUS_AREAS,
} from "../domain.ts";
import type { Member, MeetingAttendance, ReportSection, SprintTask } from "../types.ts";

assert.equal(ZEUS_AREAS.length, 11, "Deve conter exatamente 11 áreas da Zeus AeroDesign");

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
const diretorAero: Member = { ...dev, id: "dir", role: "diretor", areaIds: ["aerodinamica", "desempenho"], directorAreaIds: ["aerodinamica"] };
const calouroAero: Member = { ...dev, id: "cal", role: "calouro", areaIds: ["aerodinamica"], directorAreaIds: [] };

// RBAC: Desenvolvedor & Capitão têm acesso total e aprovam contas/reuniões
assert.equal(canApproveAccounts(dev), true);
assert.equal(canApproveInMeeting(dev), true);
assert.equal(canViewPrivateArea(dev, "financeiro"), true);
assert.equal(canManageArea(dev, "estruturas"), true);
assert.equal(canApproveAccounts(capitao), true);

// RBAC: Diretor gerencia somente área onde é diretor, vê privado apenas das áreas onde participa
assert.equal(canApproveAccounts(diretorAero), false);
assert.equal(canApproveInMeeting(diretorAero), false);
assert.equal(canManageArea(diretorAero, "aerodinamica"), true);
assert.equal(canManageArea(diretorAero, "desempenho"), false);
assert.equal(canViewPrivateArea(diretorAero, "desempenho"), true);
assert.equal(canViewPrivateArea(diretorAero, "estruturas"), false);

// RBAC: Calouro vê privado apenas da própria área
assert.equal(canViewPrivateArea(calouroAero, "aerodinamica"), true);
assert.equal(canViewPrivateArea(calouroAero, "financeiro"), false);

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

// Relatórios: cálculo automático e override manual
const sections: ReportSection[] = [
  { id: "r1", seasonYear: 2026, areaId: "aerodinamica", title: "1", completed: true, impactedAreaIds: [] },
  { id: "r2", seasonYear: 2026, areaId: "aerodinamica", title: "2", completed: true, impactedAreaIds: [] },
  { id: "r3", seasonYear: 2026, areaId: "aerodinamica", title: "3", completed: false, impactedAreaIds: [] },
];
assert.equal(computeReportPercentage("aerodinamica", sections), 67);
assert.equal(computeReportPercentage("aerodinamica", sections, 85), 85);
assert.equal(computeReportPercentage("estruturas", sections), 0);

const teamReport = computeTeamReportPercentage(
  ZEUS_AREAS.slice(0, 2),
  sections,
  { cargas: 50 }
);
assert.equal(teamReport.teamPercentage, 59, "Média entre 67% e 50% arredonda para 59%");

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

console.log("All Zeus domain & RBAC tests passed!");
