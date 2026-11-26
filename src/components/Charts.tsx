"use client";

import { useEffect, useState } from "react";
import {
  computeForecastTarget,
  evaluateScheduleHealth,
  getAreaMeta,
  projectTeamProgressAt,
} from "@/lib/domain";

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
  const strokeColor = clamped >= 80 ? "#10b981" : clamped >= 45 ? "#f59e0b" : "#3b82f6";

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
          style={{
            transition: "stroke-dashoffset 600ms var(--ease-enter)",
            filter: `drop-shadow(0 0 4px ${strokeColor}66)`,
          }}
        />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold">{clamped}%</span>
    </div>
  );
}

export function MiniSparkline({
  values,
  color = "#f59e0b",
}: {
  values: number[];
  color?: string;
}) {
  const pts = values.length >= 2 ? values : [0, values[0] ?? 1];
  const max = Math.max(1, ...pts);
  const min = Math.min(0, ...pts);
  const w = 72;
  const h = 24;
  const d = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - 3 - ((v - min) / (max - min || 1)) * (h - 6);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-18 shrink-0 overflow-visible">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
      />
    </svg>
  );
}

export function ForecastCurveChart({
  actualPct,
  currentDaysRemaining,
}: {
  actualPct: number;
  currentDaysRemaining: number | null;
}) {
  const safeCurrentDays = Math.max(0, Math.min(365, currentDaysRemaining ?? 240));
  const [inspectDays, setInspectDays] = useState<number>(200);

  const presets = [
    { label: "Hoje", days: safeCurrentDays },
    { label: "-300d", days: 300 },
    { label: "-200d", days: 200 },
    { label: "-100d", days: 100 },
    { label: "-30d", days: 30 },
  ];

  const milestones = [365, 300, 240, 200, 150, 100, 60, 30, 0];
  const w = 560;
  const h = 195;
  const padX = 32;
  const padTop = 20;
  const padBottom = 28;

  const toX = (daysBefore: number) =>
    padX + ((365 - Math.max(0, Math.min(365, daysBefore))) / 365) * (w - padX * 2);
  const toY = (pct: number) =>
    padTop + (1 - Math.max(0, Math.min(100, pct)) / 100) * (h - padTop - padBottom);

  const targetCoords = milestones.map((d) => ({
    d,
    x: toX(d),
    y: toY(computeForecastTarget(d)),
    val: computeForecastTarget(d),
  }));

  const projCoords = milestones.map((d) => {
    const val = projectTeamProgressAt(actualPct, safeCurrentDays, d);
    return { d, x: toX(d), y: toY(val), val };
  });

  const buildSmoothPath = (pts: Array<{ x: number; y: number }>) =>
    pts
      .map((pt, i) => {
        if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        const prev = pts[i - 1];
        const cx = ((prev.x + pt.x) / 2).toFixed(1);
        return `C ${cx} ${prev.y.toFixed(1)}, ${cx} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      })
      .join(" ");

  const targetPath = buildSmoothPath(targetCoords);
  const projPath = buildSmoothPath(projCoords);
  const projArea = `${projPath} L ${projCoords[projCoords.length - 1].x.toFixed(1)} ${(h - padBottom).toFixed(1)} L ${projCoords[0].x.toFixed(1)} ${(h - padBottom).toFixed(1)} Z`;

  const projectedAtInspect = projectTeamProgressAt(actualPct, safeCurrentDays, inspectDays);
  const healthAtInspect = evaluateScheduleHealth(projectedAtInspect, inspectDays);

  const markerX = toX(inspectDays);
  const markerProjY = toY(projectedAtInspect);
  const markerTargetY = toY(healthAtInspect.targetPct);

  const statusColors = {
    ahead: "border-emerald-500/45 bg-emerald-500/15 text-emerald-400",
    on_track: "border-sky-500/45 bg-sky-500/15 text-sky-400",
    behind: "border-rose-500/45 bg-rose-500/15 text-rose-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {presets.map((p) => {
            const active = inspectDays === p.days;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => setInspectDays(p.days)}
                className={`zeus-btn rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium ${
                  active
                    ? "border-amber-500 bg-amber-500/20 text-amber-400"
                    : "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusColors[healthAtInspect.status]}`}
        >
          {healthAtInspect.label} ({healthAtInspect.delta >= 0 ? `+${healthAtInspect.delta}` : healthAtInspect.delta}%)
        </span>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48 overflow-visible">
        <defs>
          <linearGradient id="zeusForecastFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((pct) => {
          const y = toY(pct);
          return (
            <g key={pct}>
              <line
                x1={padX}
                x2={w - padX}
                y1={y}
                y2={y}
                stroke="var(--hairline)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padX - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-[var(--ink-subtle)] text-[9px] font-mono"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        <path d={projArea} fill="url(#zeusForecastFill)" />
        <path
          d={targetPath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.75"
          strokeDasharray="5 4"
          opacity="0.85"
        />
        <path
          d={projPath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.6"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.45))" }}
        />

        <line
          x1={markerX}
          x2={markerX}
          y1={padTop}
          y2={h - padBottom}
          stroke="rgba(245, 158, 11, 0.5)"
          strokeWidth="1.2"
        />
        <circle cx={markerX} cy={markerTargetY} r={4} fill="#38bdf8" stroke="var(--surface-1)" strokeWidth="1.5" />
        <circle cx={markerX} cy={markerProjY} r={9} fill="rgba(245, 158, 11, 0.22)" />
        <circle cx={markerX} cy={markerProjY} r={4.5} fill="#fbbf24" stroke="var(--surface-1)" strokeWidth="2" />

        {[365, 300, 200, 100, 30, 0].map((d) => (
          <text
            key={d}
            x={toX(d)}
            y={h - 6}
            textAnchor="middle"
            className="fill-[var(--ink-subtle)] text-[9px] font-mono"
          >
            {d === 0 ? "Comp." : `-${d}d`}
          </text>
        ))}
      </svg>

      <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)]/80 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>
            Simulando: <strong className="font-mono text-amber-400">faltando {inspectDays} dias</strong>
          </span>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-sky-400">Meta SAE: {healthAtInspect.targetPct}%</span>
            <span className="text-amber-400">Ritmo Zeus: {projectedAtInspect}%</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={365}
          step={5}
          value={365 - inspectDays}
          onChange={(e) => setInspectDays(365 - Number(e.target.value))}
          aria-label="Simular dias restantes para a competição"
          className="w-full accent-amber-500 cursor-pointer"
        />
      </div>
    </div>
  );
}

export function AreaHealthHeatmap({
  rows,
  onSelectArea,
}: {
  rows: Array<{ areaId: string; reportPct: number; sprintPct: number; linksCount: number }>;
  onSelectArea?: (areaId: string) => void;
}) {
  const cellTone = (val: number) => {
    if (val >= 75) return "bg-emerald-500/85 text-zinc-950 font-semibold";
    if (val >= 45) return "bg-amber-500/65 text-zinc-950 font-medium";
    if (val >= 20) return "bg-blue-600/45 text-sky-100";
    return "bg-[var(--surface-2)] text-[var(--ink-subtle)]";
  };

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-12 gap-1.5 text-[10px] font-mono text-[var(--ink-subtle)] px-1">
        <span className="col-span-5">Área</span>
        <span className="col-span-2 text-center">Relat.</span>
        <span className="col-span-2 text-center">Sprint</span>
        <span className="col-span-3 text-center">Conexões</span>
      </div>

      <div className="space-y-1">
        {rows.map((r) => {
          const linkScore = Math.min(100, r.linksCount * 25);
          const meta = getAreaMeta(r.areaId);
          return (
            <button
              key={r.areaId}
              type="button"
              onClick={() => onSelectArea?.(r.areaId)}
              className="w-full grid grid-cols-12 gap-1.5 items-center text-left hover:opacity-95 transition-opacity"
            >
              <span className="col-span-5 text-[11px] font-medium truncate pr-1 flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: meta.colorHex }}
                />
                <span className="font-mono text-[10px]" style={{ color: meta.colorHex }}>
                  {meta.shortCode}
                </span>
                <span className="truncate">{meta.name}</span>
              </span>
              <span className={`col-span-2 rounded py-1 text-center font-mono text-[10px] ${cellTone(r.reportPct)}`}>
                {r.reportPct}%
              </span>
              <span className={`col-span-2 rounded py-1 text-center font-mono text-[10px] ${cellTone(r.sprintPct)}`}>
                {r.sprintPct}%
              </span>
              <span className={`col-span-3 rounded py-1 text-center font-mono text-[10px] ${cellTone(linkScore)}`}>
                {r.linksCount} links
              </span>
            </button>
          );
        })}
      </div>
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
}: {
  items: Array<{ areaId: string; percentage: number }>;
}) {
  const sorted = [...items].sort((a, b) => b.percentage - a.percentage).slice(0, 6);

  return (
    <div className="space-y-2.5">
      {sorted.map((item, idx) => {
        const meta = getAreaMeta(item.areaId);
        return (
          <div key={item.areaId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium truncate flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: meta.colorHex }}
                />
                {meta.name}
              </span>
              <span className="font-mono font-semibold" style={{ color: meta.colorHex }}>
                {item.percentage}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
              <div
                style={{
                  width: `${Math.max(3, item.percentage)}%`,
                  animationDelay: `${idx * 40}ms`,
                  backgroundColor: meta.colorHex,
                }}
                className="zeus-bar-grow-x h-full rounded-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
