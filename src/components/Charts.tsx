"use client";

import { useEffect, useState } from "react";
import { getAreaCode, getAreaName } from "@/lib/domain";

export function GaugeRing({ percentage }: { percentage: number }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedPct(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - (animatedPct / 100) * c;
  const strokeColor = clamped >= 80 ? "#10b981" : "var(--zeus-blue)";

  return (
    <div className="relative h-12 w-12 shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--hairline-strong)"
          strokeWidth="4.5"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms var(--ease-enter)" }}
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold">{clamped}%</span>
    </div>
  );
}

export interface TimelinePoint {
  label: string;
  value: number;
  subtitle: string;
}

export function SprintAreaChart({ points }: { points: TimelinePoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number>(Math.max(0, points.length - 1));
  const w = 520;
  const h = 175;
  const padX = 28;
  const padTop = 18;
  const padBottom = 26;
  const maxVal = Math.max(10, ...points.map((p) => p.value));

  const coords = points.map((p, i) => {
    const x =
      points.length <= 1
        ? w / 2
        : padX + (i / (points.length - 1)) * (w - padX * 2);
    const y =
      padTop + (1 - p.value / maxVal) * (h - padTop - padBottom);
    return { x, y, ...p };
  });

  const linePath = coords
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(h - padBottom).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(h - padBottom).toFixed(1)} Z`
      : "";

  const active = coords[hoverIdx] ?? coords[coords.length - 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44 overflow-visible">
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = padTop + ratio * (h - padTop - padBottom);
          return (
            <line
              key={idx}
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke="var(--hairline)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {areaPath && <path d={areaPath} fill="rgba(59, 130, 246, 0.10)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--zeus-blue)"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={padTop}
            y2={h - padBottom}
            stroke="var(--hairline-strong)"
            strokeWidth="1"
          />
        )}

        {coords.map((pt, i) => {
          const isHover = i === hoverIdx;
          return (
            <g key={pt.label} onMouseEnter={() => setHoverIdx(i)} className="cursor-pointer">
              <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
              {isHover && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={9}
                  fill="rgba(245, 158, 11, 0.18)"
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHover ? 4.5 : 3}
                fill={isHover ? "var(--zeus-gold-bright)" : "var(--zeus-blue)"}
                stroke="var(--surface-1)"
                strokeWidth="2"
                style={{ transition: "r 150ms var(--ease-ui)" }}
              />
              <text
                x={pt.x}
                y={h - 6}
                textAnchor="middle"
                className="fill-[var(--ink-subtle)] text-[10px] font-mono"
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>

      {active && (
        <div className="mt-1 flex items-center justify-between rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-1.5 text-xs">
          <span className="text-[var(--ink-muted)] font-medium">{active.subtitle}</span>
          <span className="font-mono font-semibold text-amber-500">{active.value} pts</span>
        </div>
      )}
    </div>
  );
}

export function StatusDonutChart({
  green,
  yellow,
  red,
}: {
  green: number;
  yellow: number;
  red: number;
}) {
  const [hovered, setHovered] = useState<"green" | "yellow" | "red" | null>(null);
  const total = green + yellow + red;
  const r = 42;
  const c = 2 * Math.PI * r;
  const safeTotal = total || 1;
  const gLen = (green / safeTotal) * c;
  const yLen = (yellow / safeTotal) * c;
  const rLen = (red / safeTotal) * c;

  const opacityFor = (key: "green" | "yellow" | "red") =>
    hovered === null || hovered === key ? 1 : 0.28;

  const segments: Array<{
    key: "green" | "yellow" | "red";
    label: string;
    count: number;
    dotClass: string;
  }> = [
    { key: "green", label: "Feito (Verde)", count: green, dotClass: "bg-emerald-500" },
    { key: "yellow", label: "Em processo (Amarelo)", count: yellow, dotClass: "bg-amber-500" },
    { key: "red", label: "Não pronto (Vermelho)", count: red, dotClass: "bg-rose-500" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative h-32 w-32 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 110 110" className="h-32 w-32 -rotate-90">
          <circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth="12"
          />
          {total > 0 && (
            <>
              <circle
                cx="55"
                cy="55"
                r={r}
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${gLen} ${c}`}
                strokeDashoffset={0}
                opacity={opacityFor("green")}
                style={{ transition: "opacity 160ms var(--ease-ui)" }}
                onMouseEnter={() => setHovered("green")}
                onMouseLeave={() => setHovered(null)}
              />
              <circle
                cx="55"
                cy="55"
                r={r}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray={`${yLen} ${c}`}
                strokeDashoffset={-gLen}
                opacity={opacityFor("yellow")}
                style={{ transition: "opacity 160ms var(--ease-ui)" }}
                onMouseEnter={() => setHovered("yellow")}
                onMouseLeave={() => setHovered(null)}
              />
              <circle
                cx="55"
                cy="55"
                r={r}
                fill="none"
                stroke="#ef4444"
                strokeWidth="12"
                strokeDasharray={`${rLen} ${c}`}
                strokeDashoffset={-(gLen + yLen)}
                opacity={opacityFor("red")}
                style={{ transition: "opacity 160ms var(--ease-ui)" }}
                onMouseEnter={() => setHovered("red")}
                onMouseLeave={() => setHovered(null)}
              />
            </>
          )}
        </svg>
        <div className="absolute text-center pointer-events-none">
          <div className="font-mono text-xl font-semibold">{total}</div>
          <div className="text-[10px] text-[var(--ink-subtle)]">tarefas</div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2 text-xs">
        {segments.map((seg) => (
          <div
            key={seg.key}
            onMouseEnter={() => setHovered(seg.key)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 transition-colors cursor-default ${
              hovered === seg.key
                ? "border-[var(--hairline-strong)] bg-[var(--surface-2)]"
                : "border-[var(--hairline)] bg-[var(--surface-2)]/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${seg.dotClass}`} />
              {seg.label}
            </span>
            <span className="font-mono font-semibold">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsBarChart({
  items,
  teamAverage,
}: {
  items: Array<{ areaId: string; percentage: number }>;
  teamAverage: number;
}) {
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const hoveredItem = items.find((i) => i.areaId === hoveredAreaId) ?? null;

  return (
    <div className="space-y-2.5">
      <div className="relative h-40 pt-4 pb-6 px-2 border-b border-[var(--hairline)] flex items-end gap-1.5 sm:gap-2">
        <div
          style={{ bottom: `calc(24px + ${(teamAverage / 100) * 110}px)` }}
          className="pointer-events-none absolute inset-x-2 border-t border-dashed border-amber-500/75 z-10 flex justify-end"
        >
          <span className="-mt-4 rounded bg-[var(--surface-1)] border border-amber-500/50 px-1.5 py-0.2 font-mono text-[9px] text-amber-500">
            Média {teamAverage}%
          </span>
        </div>

        {items.map((item, idx) => {
          const barHeight = Math.max(4, Math.round((item.percentage / 100) * 110));
          const isAboveAvg = item.percentage >= teamAverage;
          const isHovered = hoveredAreaId === item.areaId;
          return (
            <div
              key={item.areaId}
              onMouseEnter={() => setHoveredAreaId(item.areaId)}
              onMouseLeave={() => setHoveredAreaId(null)}
              title={`${getAreaName(item.areaId)}: ${item.percentage}%`}
              className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0 cursor-pointer"
            >
              <span
                className={`font-mono text-[9px] transition-colors ${
                  isHovered ? "text-amber-500 font-semibold" : "text-[var(--ink-subtle)]"
                }`}
              >
                {item.percentage}%
              </span>
              <div
                style={{
                  height: `${barHeight}px`,
                  animationDelay: `${idx * 25}ms`,
                }}
                className={`zeus-bar-grow w-full max-w-6 rounded-t-sm transition-colors ${
                  isHovered
                    ? "bg-amber-500"
                    : isAboveAvg
                    ? "bg-blue-500"
                    : "bg-slate-400/45 dark:bg-slate-600/75"
                }`}
              />
              <span
                className={`font-mono text-[9px] truncate max-w-full transition-colors ${
                  isHovered ? "text-[var(--ink)] font-semibold" : "text-[var(--ink-subtle)]"
                }`}
              >
                {getAreaCode(item.areaId)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--ink-subtle)]">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-blue-500" /> Na média ou acima
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-slate-400/60 dark:bg-slate-600" /> Abaixo da média
          </span>
        </div>
        <span className="font-mono text-[var(--ink-muted)]">
          {hoveredItem
            ? `${getAreaName(hoveredItem.areaId)}: ${hoveredItem.percentage}%`
            : "Passe o mouse nas barras"}
        </span>
      </div>
    </div>
  );
}
