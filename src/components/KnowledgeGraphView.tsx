"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Network, RotateCcw, Search, ZoomIn, ZoomOut } from "lucide-react";
import {
  computeAreaGraphEdges,
  computeReportPercentage,
  getAreaCode,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import { PriorityBadge } from "./Badge";

interface SatelliteNode {
  id: string;
  label: string;
  kind: "task" | "archive" | "lesson";
  areaId: string;
  impactedAreaIds: string[];
  x: number;
  y: number;
  url?: string;
}

const DEFAULT_HUBS: Record<string, { x: number; y: number }> = (() => {
  const map: Record<string, { x: number; y: number }> = {};
  const cx = 380;
  const cy = 240;
  const rx = 250;
  const ry = 165;
  ZEUS_AREAS.forEach((area, i) => {
    const angle = (i / ZEUS_AREAS.length) * Math.PI * 2 - Math.PI / 2;
    map[area.id] = {
      x: Math.round(cx + Math.cos(angle) * rx),
      y: Math.round(cy + Math.sin(angle) * ry),
    };
  });
  return map;
})();

export function KnowledgeGraphView() {
  const { state } = useZeus();
  const [hubPositions, setHubPositions] = useState(DEFAULT_HUBS);
  const [selectedId, setSelectedId] = useState<string>("integracao");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [seasonScope, setSeasonScope] = useState<"season" | "all">("all");
  const [layers, setLayers] = useState({ tasks: true, archive: true, lessons: true });

  const seasonSprints = useMemo(
    () =>
      new Set(
        state.sprints
          .filter((s) => seasonScope === "all" || s.seasonYear === state.activeSeason)
          .map((s) => s.id)
      ),
    [state.sprints, seasonScope, state.activeSeason]
  );

  const scopedTasks = useMemo(
    () =>
      layers.tasks
        ? state.tasks.filter((t) => seasonSprints.has(t.sprintId))
        : [],
    [layers.tasks, state.tasks, seasonSprints]
  );

  const scopedReports = useMemo(
    () =>
      state.reportSections.filter(
        (r) => seasonScope === "all" || r.seasonYear === state.activeSeason
      ),
    [state.reportSections, seasonScope, state.activeSeason]
  );

  const scopedArchive = useMemo(
    () =>
      layers.archive
        ? state.archiveDocuments.filter(
            (d) => seasonScope === "all" || d.seasonYear === state.activeSeason
          )
        : [],
    [layers.archive, state.archiveDocuments, seasonScope, state.activeSeason]
  );

  const scopedLessons = useMemo(
    () =>
      layers.lessons
        ? state.competitionLessons.filter(
            (l) => seasonScope === "all" || l.seasonYear === state.activeSeason
          )
        : [],
    [layers.lessons, state.competitionLessons, seasonScope, state.activeSeason]
  );

  const edges = useMemo(
    () => computeAreaGraphEdges(scopedTasks, scopedReports, scopedArchive, scopedLessons),
    [scopedTasks, scopedReports, scopedArchive, scopedLessons]
  );

  const satellites = useMemo<SatelliteNode[]>(() => {
    const grouped: Record<string, Array<Omit<SatelliteNode, "x" | "y">>> = {};
    const pushItem = (item: Omit<SatelliteNode, "x" | "y">) => {
      if (!grouped[item.areaId]) grouped[item.areaId] = [];
      grouped[item.areaId].push(item);
    };

    for (const t of scopedTasks) {
      pushItem({
        id: `sat-${t.id}`,
        label: t.title,
        kind: "task",
        areaId: t.areaId,
        impactedAreaIds: t.impactedAreaIds,
        url: t.externalUrl,
      });
    }
    for (const d of scopedArchive) {
      pushItem({
        id: `sat-${d.id}`,
        label: d.title,
        kind: "archive",
        areaId: d.areaId,
        impactedAreaIds: d.impactedAreaIds,
        url: d.externalUrl,
      });
    }
    for (const l of scopedLessons) {
      pushItem({
        id: `sat-${l.id}`,
        label: l.title,
        kind: "lesson",
        areaId: l.areaId,
        impactedAreaIds: l.impactedAreaIds,
      });
    }

    const result: SatelliteNode[] = [];
    for (const area of ZEUS_AREAS) {
      const hub = hubPositions[area.id];
      const items = grouped[area.id] ?? [];
      const cx = 380;
      const cy = 240;
      const baseAngle = Math.atan2(hub.y - cy, hub.x - cx);
      items.forEach((item, idx) => {
        const spread = (idx - (items.length - 1) / 2) * 0.42;
        const dist = 48 + (idx % 2) * 16;
        result.push({
          ...item,
          x: Math.round(hub.x + Math.cos(baseAngle + spread) * dist),
          y: Math.round(hub.y + Math.sin(baseAngle + spread) * dist),
        });
      });
    }
    return result;
  }, [scopedTasks, scopedArchive, scopedLessons, hubPositions]);

  const degreeMap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of ZEUS_AREAS) counts[a.id] = 0;
    for (const e of edges) {
      counts[e.from] = (counts[e.from] ?? 0) + e.weight;
      counts[e.to] = (counts[e.to] ?? 0) + e.weight;
    }
    return counts;
  }, [edges]);

  const selectedSat = satellites.find((s) => s.id === selectedId) ?? null;
  const activeAreaId = selectedSat ? selectedSat.areaId : selectedId;
  const activeArea = ZEUS_AREAS.find((a) => a.id === activeAreaId) ?? ZEUS_AREAS[0];
  const outgoing = edges.filter((e) => e.from === activeArea.id);
  const incoming = edges.filter((e) => e.to === activeArea.id);

  const q = search.trim().toLowerCase();
  const matchesQuery = (text: string) => !q || text.toLowerCase().includes(q);

  const viewW = Math.round(760 / zoom);
  const viewH = Math.round(480 / zoom);
  const viewX = Math.round((760 - viewW) / 2);
  const viewY = Math.round((480 - viewH) / 2);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-400" />
            Grafo de Conexões · Constelação Obsidian
          </h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Liga automaticamente as 11 áreas pelos assuntos de sprints, documentos do acervo e erros da competição. Arraste qualquer área para reorganizar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[var(--ink-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar nó..."
              className="h-8 w-36 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] pl-8 pr-2 text-xs"
            />
          </div>

          <div className="inline-flex rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setSeasonScope("all")}
              className={`rounded px-2 py-1 ${
                seasonScope === "all" ? "bg-blue-600 text-white" : "text-[var(--ink-subtle)]"
              }`}
            >
              Tudo
            </button>
            <button
              type="button"
              onClick={() => setSeasonScope("season")}
              className={`rounded px-2 py-1 ${
                seasonScope === "season" ? "bg-blue-600 text-white" : "text-[var(--ink-subtle)]"
              }`}
            >
              ZEUS {state.activeSeason}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
            title="Aproximar"
            className="h-8 w-8 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            title="Afastar"
            className="h-8 w-8 rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] flex items-center justify-center"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setHubPositions(DEFAULT_HUBS);
              setZoom(1);
            }}
            className="zeus-btn h-8 inline-flex items-center gap-1 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 text-xs"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
      </div>

      {/* Layer toggles */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-[var(--ink-subtle)]">Camadas no grafo:</span>
        {(
          [
            { key: "tasks", label: "Tarefas de Sprint", color: "text-sky-400 border-sky-500/40 bg-sky-500/10" },
            { key: "archive", label: "Acervo & Relatórios", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
            { key: "lessons", label: "Erros SAE", color: "text-rose-400 border-rose-500/40 bg-rose-500/10" },
          ] as const
        ).map((l) => {
          const on = layers[l.key];
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => setLayers((prev) => ({ ...prev, [l.key]: !prev[l.key] }))}
              className={`rounded-full border px-2.5 py-0.5 font-medium transition-opacity ${
                on ? l.color : "border-[var(--hairline)] text-[var(--ink-subtle)] opacity-55"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Interactive Obsidian Constellation Canvas */}
        <div className="lg:col-span-2 zeus-card rounded-xl p-2 bg-[#07090e] zeus-hud-grid overflow-hidden">
          <svg
            viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
            className="w-full h-[410px] sm:h-[470px] select-none touch-none"
            onPointerMove={(e) => {
              if (!draggingId) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(45, Math.min(715, viewX + ((e.clientX - rect.left) / rect.width) * viewW));
              const y = Math.max(40, Math.min(440, viewY + ((e.clientY - rect.top) / rect.height) * viewH));
              setHubPositions((prev) => ({ ...prev, [draggingId]: { x, y } }));
            }}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
          >
            {/* Inter-area hub connections */}
            {edges.map((edge) => {
              const p1 = hubPositions[edge.from];
              const p2 = hubPositions[edge.to];
              if (!p1 || !p2) return null;
              const touchesActive = edge.from === activeArea.id || edge.to === activeArea.id;
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={edge.criticalCount > 0 ? "#f59e0b" : "#38bdf8"}
                  strokeWidth={Math.min(3, 0.9 + edge.weight * 0.4)}
                  opacity={touchesActive ? 0.85 : 0.14}
                  style={{ transition: "opacity 180ms ease" }}
                />
              );
            })}

            {/* Satellite tether & cross-impact threads */}
            {satellites.map((sat) => {
              const parent = hubPositions[sat.areaId];
              const isRelated =
                sat.id === selectedId ||
                sat.areaId === activeArea.id ||
                sat.impactedAreaIds.includes(activeArea.id);
              const matched = matchesQuery(sat.label);
              const op = matched ? (isRelated ? 0.65 : 0.12) : 0.05;
              const satColor =
                sat.kind === "archive"
                  ? "#f59e0b"
                  : sat.kind === "lesson"
                  ? "#fb7185"
                  : "#38bdf8";

              return (
                <g key={`edges-${sat.id}`} opacity={op} style={{ transition: "opacity 180ms ease" }}>
                  <line
                    x1={parent.x}
                    y1={parent.y}
                    x2={sat.x}
                    y2={sat.y}
                    stroke={satColor}
                    strokeWidth="0.9"
                  />
                  {sat.impactedAreaIds.map((targetId) => {
                    const target = hubPositions[targetId];
                    if (!target) return null;
                    return (
                      <line
                        key={`${sat.id}->${targetId}`}
                        x1={sat.x}
                        y1={sat.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={satColor}
                        strokeWidth="0.7"
                        strokeDasharray="3 3"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Satellite nodes */}
            {satellites.map((sat) => {
              const isSelected = sat.id === selectedId;
              const isRelated =
                isSelected ||
                sat.areaId === activeArea.id ||
                sat.impactedAreaIds.includes(activeArea.id);
              const matched = matchesQuery(sat.label);
              const fill =
                sat.kind === "archive"
                  ? "#f59e0b"
                  : sat.kind === "lesson"
                  ? "#fb7185"
                  : "#38bdf8";

              return (
                <g
                  key={sat.id}
                  transform={`translate(${sat.x}, ${sat.y})`}
                  opacity={matched ? (isRelated ? 0.95 : 0.28) : 0.08}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(sat.id)}
                >
                  <title>{sat.label}</title>
                  <circle
                    r={isSelected ? 6 : 4}
                    fill={fill}
                    stroke="#07090e"
                    strokeWidth="1.2"
                  />
                  {isSelected && (
                    <circle r={10} fill="none" stroke={fill} strokeWidth="1" opacity="0.6" />
                  )}
                </g>
              );
            })}

            {/* 11 Area Hub Nodes */}
            {ZEUS_AREAS.map((area) => {
              const pos = hubPositions[area.id];
              const pct = computeReportPercentage(
                area.id,
                scopedReports,
                state.reportOverrides[area.id]
              );
              const deg = degreeMap[area.id] ?? 0;
              const r = 16 + Math.min(9, deg * 1.1);
              const isSelected = area.id === activeArea.id;
              const isNeighbor = edges.some(
                (e) =>
                  (e.from === activeArea.id && e.to === area.id) ||
                  (e.to === activeArea.id && e.from === area.id)
              );
              const matched = matchesQuery(area.name) || matchesQuery(area.shortCode);
              const dimmed = !matched || (!isSelected && !isNeighbor);
              const ringColor =
                pct >= 75 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#3b82f6";

              return (
                <g
                  key={area.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  opacity={dimmed ? 0.34 : 1}
                  className="cursor-grab active:cursor-grabbing"
                  style={{ transition: "opacity 180ms ease" }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(area.id);
                    setDraggingId(area.id);
                  }}
                >
                  {isSelected && (
                    <circle
                      r={r + 6}
                      fill="rgba(59, 130, 246, 0.18)"
                      stroke="rgba(59, 130, 246, 0.65)"
                      strokeWidth="1.2"
                    />
                  )}
                  <circle
                    r={r}
                    fill="#0d111a"
                    stroke={isSelected ? "#38bdf8" : ringColor}
                    strokeWidth={isSelected ? 2.5 : 1.8}
                  />
                  <text
                    textAnchor="middle"
                    dy="-1"
                    className="fill-slate-100 font-mono text-[8.5px] font-bold pointer-events-none"
                  >
                    {area.shortCode}
                  </text>
                  <text
                    textAnchor="middle"
                    dy="9"
                    className="fill-amber-400 font-mono text-[7.5px] pointer-events-none"
                  >
                    {pct}%
                  </text>
                  <text
                    textAnchor="middle"
                    dy={r + 11}
                    className="fill-slate-300 text-[8.5px] font-medium pointer-events-none"
                  >
                    {area.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side Connection Inspector */}
        <aside className="zeus-card rounded-xl p-4 space-y-4">
          {selectedSat && (
            <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-sky-400">
                <span>
                  {selectedSat.kind === "archive"
                    ? "DOCUMENTO DO ACERVO"
                    : selectedSat.kind === "lesson"
                    ? "ERRO / LIÇÃO SAE"
                    : "TAREFA DA SPRINT"}
                </span>
                <span>{getAreaCode(selectedSat.areaId)}</span>
              </div>
              <div className="text-xs font-semibold">{selectedSat.label}</div>
              {selectedSat.impactedAreaIds.length > 0 && (
                <div className="text-[11px] text-[var(--ink-subtle)]">
                  Conecta com: {selectedSat.impactedAreaIds.map(getAreaCode).join(", ")}
                </div>
              )}
              {selectedSat.url && (
                <a
                  href={selectedSat.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                >
                  Abrir arquivo no Drive/Teams <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <div>
            <div className="font-mono text-[10px] text-blue-400">{activeArea.shortCode}</div>
            <h2 className="text-base font-semibold">{activeArea.name}</h2>
            <p className="text-xs text-[var(--ink-subtle)]">{activeArea.description}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-amber-400">
              Alimenta outras áreas ({outgoing.length})
            </h3>
            {outgoing.length === 0 ? (
              <div className="text-xs text-[var(--ink-subtle)]">
                Nenhuma dependência de saída cadastrada.
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {outgoing.map((edge) => {
                  const target = ZEUS_AREAS.find((a) => a.id === edge.to);
                  return (
                    <div
                      key={edge.to}
                      className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5 space-y-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(edge.to)}
                        className="text-xs font-semibold flex items-center gap-1 hover:text-amber-400"
                      >
                        <ArrowRight className="h-3 w-3 text-amber-500" />
                        {target?.name ?? edge.to} ({edge.weight})
                      </button>
                      {edge.items.map((item) => (
                        <div
                          key={item.id}
                          className="text-[11px] text-[var(--ink-muted)] flex items-center justify-between gap-2"
                        >
                          <span className="truncate">• {item.title}</span>
                          {item.priority && <PriorityBadge priority={item.priority} />}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--hairline)] space-y-2">
            <h3 className="text-xs font-semibold text-sky-400">
              Recebe dados de ({incoming.length})
            </h3>
            {incoming.length === 0 ? (
              <div className="text-xs text-[var(--ink-subtle)]">
                Nenhuma dependência de entrada cadastrada.
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {incoming.map((edge) => {
                  const src = ZEUS_AREAS.find((a) => a.id === edge.from);
                  return (
                    <div
                      key={edge.from}
                      className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/70 p-2.5 space-y-1"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(edge.from)}
                        className="text-xs font-semibold hover:text-sky-400"
                      >
                        {src?.name ?? edge.from} ({edge.weight})
                      </button>
                      {edge.items.map((item) => (
                        <div key={item.id} className="text-[11px] text-[var(--ink-muted)] truncate">
                          • {item.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
