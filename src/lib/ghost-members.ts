import type { AreaMembership, Member, Role, SprintTask, ZeusState } from "./types.ts";

export interface GhostMemberDefinition {
  id: string;
  fullName: string;
  areaIds: string[];
  directorAreaIds: string[];
  role: Role;
  roleConfirmed: boolean;
  aliases: string[];
}

/**
 * Verified Equipe Zeus 2026 roster from Microsoft Teams, "PRESENÇA 2026",
 * and direct leadership confirmation (directors & area assignments).
 *
 * Unknown fields (email, bio, lab schedule, or unconfirmed personal roles) are
 * intentionally kept blank/neutral.
 */
export const GHOST_TEAM_ROSTER: readonly GhostMemberDefinition[] = [
  // Confirmed 2026 Directors & Members per area
  {
    id: "ghost-jodson",
    fullName: "Jodson Monteiro Pestana",
    areaIds: ["aerodinamica", "estabilidade"],
    directorAreaIds: ["aerodinamica", "estabilidade"],
    role: "diretor",
    roleConfirmed: true,
    aliases: ["jodson"],
  },
  {
    id: "ghost-jullya",
    fullName: "Jullya Sophia Santos Pereira",
    areaIds: ["aerodinamica"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: true,
    aliases: ["jullya"],
  },
  {
    id: "ghost-mariany",
    fullName: "Mariany Pereira Gomes",
    areaIds: ["aerodinamica"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: true,
    aliases: ["mariany"],
  },
  {
    id: "ghost-samuel",
    fullName: "Samuel Levi Pereira dos Santos",
    areaIds: ["estabilidade"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: true,
    aliases: ["samuel levi", "samuel"],
  },
  {
    id: "ghost-danilo",
    fullName: "Danilo Silva Gonçalves",
    areaIds: ["estabilidade"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: true,
    aliases: ["danilo"],
  },
  {
    id: "ghost-max",
    fullName: "Max Duarte Costa",
    areaIds: ["eletrico"],
    directorAreaIds: ["eletrico"],
    role: "diretor",
    roleConfirmed: true,
    aliases: ["max"],
  },
  {
    id: "ghost-anna-clara",
    fullName: "Anna Clara Alves",
    areaIds: ["eletrico", "plantas"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: true,
    aliases: ["anna clara", "anna"],
  },
  {
    id: "ghost-rebeca",
    fullName: "Rebeca Dias Moreira Pinheiro",
    areaIds: ["plantas", "integracao"],
    directorAreaIds: ["plantas", "integracao"],
    role: "diretor",
    roleConfirmed: true,
    aliases: ["rebeca"],
  },
  {
    id: "ghost-jamerson",
    fullName: "Jamerson Vinicius Sousa Santos",
    areaIds: ["plantas"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: true,
    aliases: ["jamerson"],
  },
  {
    id: "ghost-thaina",
    fullName: "Thainá Pâmela Nascimento Saraiva",
    areaIds: ["desempenho", "integracao", "marketing", "financeiro", "gestao"],
    directorAreaIds: ["desempenho"],
    role: "diretor",
    roleConfirmed: true,
    aliases: ["thaina", "thainá", "thaína"],
  },
  {
    id: "ghost-richeldson",
    fullName: "Richeldson Felipe de Oliveira Costa",
    areaIds: ["desempenho"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: true,
    aliases: ["shell", "richeldson", "risheldson"],
  },
  {
    id: "ghost-rodrigo",
    fullName: "Cledson Rodrigo D' Eça Santos",
    areaIds: ["cargas"],
    directorAreaIds: ["cargas"],
    role: "diretor",
    roleConfirmed: true,
    aliases: ["cledson", "rodrigo"],
  },
  {
    id: "ghost-arthur",
    fullName: "Arthur Pãozinho Neves",
    areaIds: ["cargas"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: true,
    aliases: ["arthur"],
  },
  {
    id: "ghost-raisa",
    fullName: "Raisa Mesquita Gomes",
    areaIds: ["marketing", "financeiro", "gestao", "integracao", "estruturas"],
    directorAreaIds: ["marketing", "financeiro", "gestao"],
    role: "diretor",
    roleConfirmed: true,
    aliases: ["raisa"],
  },
  {
    id: "ghost-mateus",
    fullName: "Mateus Costa da Silva",
    areaIds: ["estruturas", "integracao", "marketing"],
    directorAreaIds: ["estruturas"],
    role: "diretor",
    roleConfirmed: true,
    aliases: ["mateus"],
  },

  // Historical 2026 teammates present in Teams / PRESENÇA 2026 spreadsheets
  {
    id: "ghost-hugo",
    fullName: "Hugo Marcelo Leal",
    areaIds: ["estruturas", "cargas"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: false,
    aliases: ["hugo"],
  },
  {
    id: "ghost-ludimilla",
    fullName: "Ludimilla Silva Lima",
    areaIds: ["estruturas"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: false,
    aliases: ["ludimilla", "ludmila"],
  },
  {
    id: "ghost-pedro-ryan",
    fullName: "Pedro Ryan Santos Tavares",
    areaIds: ["estruturas"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: false,
    aliases: ["pedro ryan", "ryan"],
  },
  {
    id: "ghost-duarte",
    fullName: "Pedro Lucas Duarte Furtado",
    areaIds: ["cargas"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: false,
    aliases: ["duarte", "durte"],
  },
  {
    id: "ghost-wemerson",
    fullName: "Wemerson Mateus Coutinho Ribeiro",
    areaIds: ["eletrico", "desempenho"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: false,
    aliases: ["wemerson mateus", "wemersom mateus", "wemerson", "w. mateus", "wm"],
  },
  {
    id: "ghost-renalli",
    fullName: "Renalli Cristine Gonçalves Mota",
    areaIds: ["marketing"],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: false,
    aliases: ["renalli"],
  },
  {
    id: "ghost-allana",
    fullName: "Allana Mirelle Marques Menezes",
    areaIds: [],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: false,
    aliases: [],
  },
  {
    id: "ghost-emilly",
    fullName: "Emilly de Castro Ferreira Moreno",
    areaIds: [],
    directorAreaIds: [],
    role: "efetivado",
    roleConfirmed: false,
    aliases: [],
  },
];

export function isGhostMemberId(id?: string | null): boolean {
  return Boolean(id && id.startsWith("ghost-"));
}

export function isImportedTeamsTask(task: SprintTask): boolean {
  return task.description.includes("Importado do Teams");
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSortedAliasPool(ghosts: readonly GhostMemberDefinition[]) {
  return ghosts
    .flatMap((ghost) =>
      ghost.aliases.map((alias) => ({
        ghostId: ghost.id,
        areaIds: ghost.areaIds,
        alias: normalizeName(alias),
      }))
    )
    .sort((a, b) => b.alias.length - a.alias.length);
}

const ALL_SORTED_ALIASES = buildSortedAliasPool(GHOST_TEAM_ROSTER);
const GHOST_BY_ID = new Map(GHOST_TEAM_ROSTER.map((g) => [g.id, g]));

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function extractExplicitCitationGhosts(task: SprintTask): {
  ghostIds: string[];
  mentionsJulio: boolean;
  mentionsAllTeam: boolean;
} {
  const citationPart = task.description.split(/Citação na planilha:/i)[1] ?? "";
  const hasExplicitCitation = citationPart.trim().length > 0;
  const rawSource = hasExplicitCitation ? citationPart : task.title;
  let working = normalizeName(rawSource);

  const matchedGhostIds: string[] = [];
  const pushUnique = (id: string) => {
    if (!matchedGhostIds.includes(id)) matchedGhostIds.push(id);
  };

  // Check multi-word / punctuated aliases first (e.g. "w. mateus" -> Wemerson, never Mateus)
  for (const pair of ALL_SORTED_ALIASES) {
    if (!pair.alias.includes(" ") && !pair.alias.includes(".")) continue;
    const multiRegex = new RegExp(
      `(^|[^a-z0-9])${escapeRegex(pair.alias)}(?=$|[^a-z0-9])`,
      "gi"
    );
    if (multiRegex.test(working)) {
      pushUnique(pair.ghostId);
      working = working.replace(multiRegex, " ");
    }
  }

  // Check single-token aliases in the remaining normalized text
  const singlePool = ALL_SORTED_ALIASES.filter(
    (p) => !p.alias.includes(" ") && !p.alias.includes(".")
  );
  // Prefer members associated with task's area first when iterating ties
  const orderedSinglePool = [
    ...singlePool.filter((p) => p.areaIds.includes(task.areaId)),
    ...singlePool,
  ];
  for (const pair of orderedSinglePool) {
    const singleRegex = new RegExp(
      `(^|[^a-z0-9])${escapeRegex(pair.alias)}(?=$|[^a-z0-9])`,
      "i"
    );
    if (singleRegex.test(working)) {
      pushUnique(pair.ghostId);
    }
  }

  const mentionsJulio = /(^|[^a-z0-9])julio(?=$|[^a-z0-9])/i.test(working);
  const mentionsAllTeam =
    /(^|[^a-z0-9])(todos|gestao e diretores|novatos)(?=$|[^a-z0-9])/i.test(working);

  return {
    ghostIds: matchedGhostIds,
    mentionsJulio,
    mentionsAllTeam,
  };
}

/**
 * Checks whether an imported/unassigned task citation explicitly names a specific ghost
 * (used when allocating a real account to claim historical tasks from that ghost).
 */
export function doesTaskCitationMatchGhost(
  task: SprintTask,
  ghost: GhostMemberDefinition
): boolean {
  const { ghostIds } = extractExplicitCitationGhosts(task);
  return ghostIds.includes(ghost.id);
}

/** Builds typed AreaMembership entries from a ghost definition (Diretor vs Efetivado). */
export function buildMembershipsForGhost(ghost: GhostMemberDefinition): AreaMembership[] {
  const dirSet = new Set(ghost.directorAreaIds);
  const allAreas = Array.from(new Set([...ghost.areaIds, ...ghost.directorAreaIds]));
  return allAreas.map((areaId) => ({
    areaId,
    role: dirSet.has(areaId) ? "diretor" : "efetivado",
  }));
}

/**
 * Lists ghost roster entries not yet allocated in `ghostAllocations` and not already
 * present by exact normalized full name among real members.
 */
export function getUnallocatedGhosts(
  members: Member[],
  ghostAllocations: Record<string, string>
): GhostMemberDefinition[] {
  const existingRealNames = new Set(
    members.filter((m) => !m.isGhost).map((m) => normalizeName(m.fullName))
  );
  return GHOST_TEAM_ROSTER.filter(
    (ghost) =>
      !ghostAllocations[ghost.id] && !existingRealNames.has(normalizeName(ghost.fullName))
  );
}

function buildResolvedAreaTeamIds(
  areaId: string,
  resolveGhostToMemberId: (ghostId: string) => string | null
): string[] {
  // Ordered: confirmed director(s) first, then confirmed 2026 area members
  const directors = GHOST_TEAM_ROSTER.filter(
    (g) => g.roleConfirmed && g.directorAreaIds.includes(areaId)
  );
  const members = GHOST_TEAM_ROSTER.filter(
    (g) =>
      g.roleConfirmed &&
      !g.directorAreaIds.includes(areaId) &&
      g.areaIds.includes(areaId)
  );
  const ordered = [...directors, ...members];
  const resolved: string[] = [];
  for (const ghost of ordered) {
    const id = resolveGhostToMemberId(ghost.id);
    if (id && !resolved.includes(id)) resolved.push(id);
  }
  return resolved;
}

/**
 * Pure client-side overlay that:
 * 1) Injects unallocated ghost team members when Presentation Mode is ON.
 * 2) Reassigns imported Teams tasks off Júlio's placeholder assignee onto the matching
 *    ghost (or real allocated member), supporting multi-person credits (`coAssigneeIds`),
 *    "Todos" area credits, and deterministic area distribution for uncited imported tasks.
 */
export function applyGhostMembersOverlay(state: ZeusState, enabled: boolean): ZeusState {
  if (!enabled) return state;

  const ghostAllocations = state.ghostAllocations ?? {};
  const activeGhostDefs = getUnallocatedGhosts(state.members, ghostAllocations);
  const activeGhostIds = new Set(activeGhostDefs.map((g) => g.id));

  const realMemberByNormalizedName = new Map<string, string>();
  let julioRealId: string | null = null;
  for (const m of state.members) {
    if (m.isGhost) continue;
    const norm = normalizeName(m.fullName);
    realMemberByNormalizedName.set(norm, m.id);
    if (!julioRealId && /\bjulio\b/.test(norm)) {
      julioRealId = m.id;
    }
  }

  const resolveGhostToMemberId = (ghostId: string): string | null => {
    const allocatedId = ghostAllocations[ghostId];
    if (allocatedId && state.members.some((m) => !m.isGhost && m.id === allocatedId)) {
      return allocatedId;
    }
    const def = GHOST_BY_ID.get(ghostId);
    if (def) {
      const existingRealId = realMemberByNormalizedName.get(normalizeName(def.fullName));
      if (existingRealId) return existingRealId;
    }
    if (activeGhostIds.has(ghostId)) return ghostId;
    return null;
  };

  const ghostMembers: Member[] = activeGhostDefs.map((ghost) => {
    const areaMemberships = buildMembershipsForGhost(ghost);
    return {
      id: ghost.id,
      fullName: ghost.fullName,
      email: "",
      role: ghost.role,
      accountStatus: "approved",
      requestedRole: ghost.role,
      areaIds: areaMemberships.map((m) => m.areaId),
      directorAreaIds: [...ghost.directorAreaIds],
      areaMemberships,
      inLabNow: false,
      isGhost: true,
      roleConfirmed: ghost.roleConfirmed,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
  });

  const combinedMembers = [...state.members, ...ghostMembers];

  const tasks = state.tasks.map((task) => {
    const imported = isImportedTeamsTask(task);
    const shouldResolve = imported || !task.assigneeId;
    if (!shouldResolve) return task;

    const { ghostIds, mentionsJulio, mentionsAllTeam } = extractExplicitCitationGhosts(task);
    const participants: string[] = [];
    for (const gId of ghostIds) {
      const resolved = resolveGhostToMemberId(gId);
      if (resolved && !participants.includes(resolved)) {
        participants.push(resolved);
      }
    }
    if (mentionsJulio && julioRealId && !participants.includes(julioRealId)) {
      participants.push(julioRealId);
    }

    if (participants.length > 0) {
      return {
        ...task,
        assigneeId: participants[0],
        coAssigneeIds: participants.length > 1 ? participants : undefined,
      };
    }

    const areaTeamIds = buildResolvedAreaTeamIds(task.areaId, resolveGhostToMemberId);
    if (mentionsAllTeam && areaTeamIds.length > 0) {
      return {
        ...task,
        assigneeId: areaTeamIds[0],
        coAssigneeIds: areaTeamIds.length > 1 ? areaTeamIds : undefined,
      };
    }

    // Imported Teams tasks without explicit person citations should still leave Júlio's
    // placeholder ID and be distributed across that area's confirmed 2026 team.
    if (imported && areaTeamIds.length > 0) {
      const picked = areaTeamIds[stableHash(task.id || task.title) % areaTeamIds.length];
      return {
        ...task,
        assigneeId: picked,
        coAssigneeIds: undefined,
      };
    }

    return task;
  });

  return {
    ...state,
    members: combinedMembers,
    tasks,
  };
}
