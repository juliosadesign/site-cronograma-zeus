"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Network, RotateCcw } from "lucide-react";
import {
  computeAreaGraphEdges,
  computeReportPercentage,
  ZEUS_AREAS,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import { PriorityBadge } from "./Badge";

const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = (() => {
  const map: Record<string, { x: number; y: number }> = {};
  const cx = 340;
  const cy = 210;
  const rx = 245;
  const ry = 155;
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
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [selectedId, setSelectedId] = useState<string>("integracao");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const edges = useMemo(
    () => computeAreaGraphEdges(state.tasks, state.reportSections),
    [state.tasks, state.reportSections]
  );

  const degreeMap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of ZEUS_AREAS) counts[a.id] = 0;
    for (const e of edges) {
      counts[e.from] = (counts[e.from] ?? 0) + e.weight;
      counts[e.to] = (counts[e.to] ?? 0) + e.weight;
    }
    return counts;
  }, [edges]);

  const activeArea = ZEUS_AREAS.find((a) => a.id === selectedId) ?? ZEUS_AREAS[0];
  const outgoing = edges.filter((e) => e.from === activeArea.id);
  const incoming = edges.filter((e) => e.to === activeArea.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Network className="h-5 w-5 text-sky-400" />
            Grafo de Conexões · Estilo Obsidian
          </h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Arraste os nós ou clique em qualquer área para isolar suas dependências de tarefas e capítulos dos relatórios SAE.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPositions(DEFAULT_POSITIONS)}
          className="zeus-btn self-start inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reorganizar nós
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Interactive Obsidian Graph Canvas */}
        <div className="lg:col-span-2 zeus-card rounded-xl p-3 bg-[#090c14] zeus-hud-grid overflow-hidden">
          <svg
            viewBox="0 0 680 420"
            className="w-full h-[380px] sm:h-[430px] select-none touch-none"
            onPointerMove={(e) => {
              if (!draggingId) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(40, Math.min(640, ((e.clientX - rect.left) / rect.width) * 680));
              const y = Math.max(36, Math.min(384, ((e.clientY - rect.top) / rect.height) * 420));
              setPositions((prev) => ({ ...prev, [draggingId]: { x, y } }));
            }}
            onPointerUp={() => setDraggingId(null)}
            onPointerLeave={() => setDraggingId(null)}
          >
            <defs>
              <marker
                id="zeusArrowBlue"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
              </marker>
              <marker
                id="zeusArrowGold"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge) => {
              const p1 = positions[edge.from];
              const p2 = positions[edge.to];
              if (!p1 || !p2) return null;
              const touchesSelected = edge.from === selectedId || edge.to === selectedId;
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const dist = Math.hypot(dx, dy) || 1;
              const rTarget = 22 + Math.min(8, (degreeMap[edge.to] ?? 0) * 1.4);
              const ex = p2.x - (dx / dist) * (rTarget + 4);
              const ey = p2.y - (dy / dist) * (rTarget + 4);

              const stroke = edge.criticalCount > 0 ? "#f59e0b" : "#38bdf8";
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={ex}
                  y2={ey}
                  stroke={stroke}
                  strokeWidth={Math.min(3.5, 1 + edge.weight * 0.45)}
                  opacity={touchesSelected ? 0.92 : 0.16}
                  markerEnd={
                    touchesSelected
                      ? edge.criticalCount > 0
                        ? "url(#zeusArrowGold)"
                        : "url(#zeusArrowBlue)"
                      : undefined
                  }
                  style={{ transition: "opacity 180ms ease" }}
                />
              );
            })}

            {/* Area Nodes */}
            {ZEUS_AREAS.map((area) => {
              const pos = positions[area.id];
              const pct = computeReportPercentage(
                area.id,
                state.reportSections,
                state.reportOverrides[area.id]
              );
              const deg = degreeMap[area.id] ?? 0;
              const r = 18 + Math.min(10, deg * 1.4);
              const isSelected = area.id === selectedId;
              const isNeighbor = edges.some(
                (e) =>
                  (e.from === selectedId && e.to === area.id) ||
                  (e.to === selectedId && e.from === area.id)
              );
              const dimmed = !isSelected && !isNeighbor;

              const ringColor =
                pct >= 75 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#3b82f6";

              return (
                <g
                  key={area.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  opacity={dimmed ? 0.32 : 1}
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
                      r={r + 7}
                      fill="rgba(245, 158, 11, 0.16)"
                      stroke="rgba(245, 158, 11, 0.45)"
                      strokeWidth="1"
                    />
                  )}
                  <circle
                    r={r}
                    fill="#10131b"
                    stroke={isSelected ? "#fbbf24" : ringColor}
                    strokeWidth={isSelected ? 2.5 : 2}
                  />
                  <text
                    textAnchor="middle"
                    dy="-1"
                    className="fill-slate-100 font-mono text-[9px] font-bold pointer-events-none"
                  >
                    {area.shortCode}
                  </text>
                  <text
                    textAnchor="middle"
                    dy="10"
                    className="fill-amber-400 font-mono text-[8px] pointer-events-none"
                  >
                    {pct}%
                  </text>
                  <text
                    textAnchor="middle"
                    dy={r + 13}
                    className="fill-slate-300 text-[9px] font-medium pointer-events-none"
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
          <div>
            <div className="font-mono text-[10px] text-sky-400">{activeArea.shortCode}</div>
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
                          <span className="truncate">
                            [{item.kind === "task" ? "Sprint" : "Relat."}] {item.title}
                          </span>
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
