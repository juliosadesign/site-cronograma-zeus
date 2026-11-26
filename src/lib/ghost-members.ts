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

function findMatchedGhostIdForCitation(
  task: SprintTask,
  allowedGhostIds?: Set<string>
): string | null {
  const source = task.description?.split(/Citação na planilha:/i)[1] ?? task.description ?? "";
  const normalizedCitation = normalizeName(source);
  if (!normalizedCitation) return null;

  // Prefer matching ghosts whose confirmed area contains the task's area first,
  // while still honoring longer global disambiguating aliases like "w. mateus".
  const areaAliases = ALL_SORTED_ALIASES.filter((p) => p.areaIds.includes(task.areaId));
  const combinedPool = [...areaAliases, ...ALL_SORTED_ALIASES];

  // Disambiguate "w. mateus" / "wemerson mateus" before short "mateus"
  for (const pair of ALL_SORTED_ALIASES) {
    if (pair.alias.includes(" ") || pair.alias.includes(".")) {
      const multiPattern = new RegExp(
        `(^|[^a-z0-9])${escapeRegex(pair.alias)}(?=$|[^a-z0-9])`,
        "i"
      );
      if (multiPattern.test(normalizedCitation)) {
        if (!allowedGhostIds || allowedGhostIds.has(pair.ghostId)) {
          return pair.ghostId;
        }
        return null;
      }
    }
  }

  for (const pair of combinedPool) {
    if (allowedGhostIds && !allowedGhostIds.has(pair.ghostId)) continue;
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(pair.alias)}(?=$|[^a-z0-9])`, "i");
    if (pattern.test(normalizedCitation)) {
      return pair.ghostId;
    }
  }

  return null;
}

/**
 * Checks whether an unassigned task citation belongs to a specific ghost definition,
 * respecting longer-alias precedence (e.g. "W. Mateus" -> Wemerson, never Mateus Costa).
 */
export function doesTaskCitationMatchGhost(
  task: SprintTask,
  ghost: GhostMemberDefinition
): boolean {
  const matched = findMatchedGhostIdForCitation(task);
  return matched === ghost.id;
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

/**
 * Pure client-side overlay that injects unallocated ghost team members when Presentation
 * Mode is ON and binds matching unassigned task citations in memory.
 */
export function applyGhostMembersOverlay(state: ZeusState, enabled: boolean): ZeusState {
  if (!enabled) return state;

  const activeGhostDefs = getUnallocatedGhosts(state.members, state.ghostAllocations ?? {});
  if (activeGhostDefs.length === 0) return state;

  const activeGhostIds = new Set(activeGhostDefs.map((g) => g.id));
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
  const memberIds = new Set(combinedMembers.map((m) => m.id));

  const tasks = state.tasks.map((task) => {
    if (task.assigneeId && memberIds.has(task.assigneeId)) return task;
    const matchedGhostId = findMatchedGhostIdForCitation(task, activeGhostIds);
    if (!matchedGhostId || matchedGhostId === task.assigneeId) return task;
    return { ...task, assigneeId: matchedGhostId };
  });

  return {
    ...state,
    members: combinedMembers,
    tasks,
  };
}
