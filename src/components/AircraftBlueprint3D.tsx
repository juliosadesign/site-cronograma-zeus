"use client";

import { useEffect, useRef, useState } from "react";
import { Move3d } from "lucide-react";

export type AircraftConcept = "monoplano" | "biplano" | "asa_voadora";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  a: number;
  b: number;
  role: "primary" | "secondary" | "axis";
}

interface Mesh {
  vertices: Vec3[];
  edges: Edge[];
  note: string;
  aspect: string;
}

const CONCEPT_LABEL: Record<AircraftConcept, string> = {
  monoplano: "Monoplano",
  biplano: "Biplano",
  asa_voadora: "Asa Voadora",
};

function buildFuselage(v: Vec3[], e: Edge[], length: number) {
  const nose = v.length;
  v.push({ x: length * 0.56, y: 0, z: 0 });
  const stations = [
    { x: length * 0.34, rx: 0.14, ry: 0.14 },
    { x: length * 0.08, rx: 0.17, ry: 0.18 },
    { x: -length * 0.22, rx: 0.13, ry: 0.13 },
    { x: -length * 0.52, rx: 0.05, ry: 0.06 },
  ];

  const rings: number[][] = [];
  for (const st of stations) {
    const base = v.length;
    v.push({ x: st.x, y: st.ry, z: 0 });
    v.push({ x: st.x, y: 0, z: st.rx });
    v.push({ x: st.x, y: -st.ry, z: 0 });
    v.push({ x: st.x, y: 0, z: -st.rx });
    rings.push([base, base + 1, base + 2, base + 3]);
    for (let i = 0; i < 4; i++) {
      e.push({ a: base + i, b: base + ((i + 1) % 4), role: "secondary" });
    }
  }

  for (const idx of rings[0]) {
    e.push({ a: nose, b: idx, role: "primary" });
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < 4; i++) {
      e.push({ a: rings[r][i], b: rings[r + 1][i], role: "primary" });
    }
  }
  e.push({ a: nose, b: rings[rings.length - 1][0], role: "axis" });
}

function addWing(
  v: Vec3[],
  e: Edge[],
  opts: {
    xCenter: number;
    yOffset: number;
    span: number;
    rootChord: number;
    tipChord: number;
    sweep: number;
    dihedral: number;
    ribs?: number;
  }
): number[] {
  const half = opts.span / 2;
  const sections = opts.ribs ?? 5;
  const leIndices: number[] = [];
  const teIndices: number[] = [];
  const midIndices: number[] = [];

  for (let i = -sections; i <= sections; i++) {
    const t = Math.abs(i) / sections;
    const z = (i / sections) * half;
    const chord = opts.rootChord + (opts.tipChord - opts.rootChord) * t;
    const leX = opts.xCenter + chord * 0.5 - t * opts.sweep;
    const teX = leX - chord;
    const y = opts.yOffset + t * opts.dihedral;

    const le = v.length;
    v.push({ x: leX, y: y + 0.02, z });
    const mid = v.length;
    v.push({ x: (leX + teX) * 0.5, y: y + 0.045, z });
    const te = v.length;
    v.push({ x: teX, y, z });

    leIndices.push(le);
    midIndices.push(mid);
    teIndices.push(te);

    e.push({ a: le, b: mid, role: "secondary" });
    e.push({ a: mid, b: te, role: "secondary" });
  }

  for (let i = 0; i < leIndices.length - 1; i++) {
    e.push({ a: leIndices[i], b: leIndices[i + 1], role: "primary" });
    e.push({ a: midIndices[i], b: midIndices[i + 1], role: "axis" });
    e.push({ a: teIndices[i], b: teIndices[i + 1], role: "primary" });
  }

  return [leIndices[0], teIndices[0], leIndices[leIndices.length - 1], teIndices[teIndices.length - 1], midIndices[2], midIndices[midIndices.length - 3]];
}

function addTail(v: Vec3[], e: Edge[], xTail: number, yBase: number) {
  addWing(v, e, {
    xCenter: xTail,
    yOffset: yBase + 0.04,
    span: 0.92,
    rootChord: 0.28,
    tipChord: 0.18,
    sweep: 0.06,
    dihedral: 0,
    ribs: 2,
  });

  const vb = v.length;
  v.push({ x: xTail + 0.14, y: yBase + 0.04, z: 0 });
  v.push({ x: xTail - 0.16, y: yBase + 0.04, z: 0 });
  v.push({ x: xTail - 0.02, y: yBase + 0.42, z: 0 });
  v.push({ x: xTail - 0.2, y: yBase + 0.4, z: 0 });
  e.push({ a: vb, b: vb + 2, role: "primary" });
  e.push({ a: vb + 2, b: vb + 3, role: "primary" });
  e.push({ a: vb + 3, b: vb + 1, role: "primary" });
  e.push({ a: vb, b: vb + 1, role: "secondary" });
}

function buildMesh(concept: AircraftConcept): Mesh {
  const vertices: Vec3[] = [];
  const edges: Edge[] = [];

  if (concept === "monoplano") {
    buildFuselage(vertices, edges, 2.2);
    addWing(vertices, edges, {
      xCenter: 0.24,
      yOffset: 0.14,
      span: 2.8,
      rootChord: 0.48,
      tipChord: 0.3,
      sweep: 0.08,
      dihedral: 0.09,
      ribs: 5,
    });
    addTail(vertices, edges, -0.98, 0.04);
    return {
      vertices,
      edges,
      aspect: "AR ~8.2 · Alta eficiência em cruzeiro",
      note: "Arquitetura clássica: menor arrasto induzido e simplicidade estrutural.",
    };
  }

  if (concept === "biplano") {
    buildFuselage(vertices, edges, 2.05);
    const upper = addWing(vertices, edges, {
      xCenter: 0.28,
      yOffset: 0.34,
      span: 2.3,
      rootChord: 0.38,
      tipChord: 0.3,
      sweep: 0.04,
      dihedral: 0.03,
      ribs: 4,
    });
    const lower = addWing(vertices, edges, {
      xCenter: 0.14,
      yOffset: -0.08,
      span: 2.2,
      rootChord: 0.38,
      tipChord: 0.3,
      sweep: 0.04,
      dihedral: 0.05,
      ribs: 4,
    });
    // Interplane struts
    for (let i = 0; i < Math.min(upper.length, lower.length); i++) {
      edges.push({ a: upper[i], b: lower[i], role: "axis" });
    }
    addTail(vertices, edges, -0.92, 0.04);
    return {
      vertices,
      edges,
      aspect: "2 planos · Maior área alar em envergadura compacta",
      note: "Foco em sustentação com envergadura restrita pelo regulamento SAE.",
    };
  }

  // Asa Voadora
  const centerPod = vertices.length;
  vertices.push({ x: 0.48, y: 0.02, z: 0 });
  vertices.push({ x: -0.42, y: 0.02, z: 0 });
  vertices.push({ x: 0.12, y: 0.12, z: 0 });
  edges.push({ a: centerPod, b: centerPod + 2, role: "primary" });
  edges.push({ a: centerPod + 2, b: centerPod + 1, role: "primary" });
  edges.push({ a: centerPod, b: centerPod + 1, role: "axis" });

  const tips = addWing(vertices, edges, {
    xCenter: 0.2,
    yOffset: 0.0,
    span: 2.75,
    rootChord: 0.68,
    tipChord: 0.26,
    sweep: 0.56,
    dihedral: 0.08,
    ribs: 5,
  });

  // Twin winglets at tips
  for (const [leIdx, teIdx] of [
    [tips[0], tips[1]],
    [tips[2], tips[3]],
  ]) {
    const le = vertices[leIdx];
    const te = vertices[teIdx];
    const topLe = vertices.length;
    vertices.push({ x: le.x - 0.08, y: le.y + 0.32, z: le.z });
    const topTe = vertices.length;
    vertices.push({ x: te.x - 0.12, y: te.y + 0.3, z: te.z });
    edges.push({ a: leIdx, b: topLe, role: "primary" });
    edges.push({ a: teIdx, b: topTe, role: "primary" });
    edges.push({ a: topLe, b: topTe, role: "primary" });
  }

  return {
    vertices,
    edges,
    aspect: "Sem empenagem · Menor peso vazio e arrasto parasita",
    note: "Exige atenção redobrada em Estabilidade e CG (estudo conceitual).",
  };
}

export function AircraftBlueprint3D() {
  const [concept, setConcept] = useState<AircraftConcept>("monoplano");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef({ yaw: -0.65, pitch: 0.42, dragging: false, lastX: 0, lastY: 0 });
  const [telemetry, setTelemetry] = useState({ yaw: -37, pitch: 24 });

  const mesh = buildMesh(concept);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let frameCount = 0;

    const render = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(260, Math.round(rect.width));
      const height = Math.max(190, Math.round(rect.height));

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (!rotationRef.current.dragging && !reducedMotion) {
        rotationRef.current.yaw += 0.0045;
      }

      const { yaw, pitch } = rotationRef.current;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const cx = width / 2;
      const cy = height / 2 + 6;
      const scale = Math.min(width, height) * 0.44;
      const fov = 4.2;

      // Subtle blueprint ring on ground plane
      ctx.strokeStyle = "rgba(56, 189, 248, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 28, scale * 1.15, scale * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      const projected = mesh.vertices.map((pt) => {
        const x1 = pt.x * cosY - pt.z * sinY;
        const z1 = pt.x * sinY + pt.z * cosY;
        const y2 = pt.y * cosP - z1 * sinP;
        const z2 = pt.y * sinP + z1 * cosP;
        const perspective = fov / (fov - z2);
        return {
          x: cx + x1 * scale * perspective,
          y: cy - y2 * scale * perspective,
          depth: z2,
        };
      });

      for (const edge of mesh.edges) {
        const p1 = projected[edge.a];
        const p2 = projected[edge.b];
        if (!p1 || !p2) continue;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (edge.role === "axis") {
          ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
          ctx.lineWidth = 1.4;
        } else if (edge.role === "primary") {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.92)";
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = "rgba(59, 130, 246, 0.38)";
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }

      // Highlight key nodes
      for (let i = 0; i < projected.length; i += 3) {
        const p = projected[i];
        ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
        ctx.fillRect(p.x - 1, p.y - 1, 2.2, 2.2);
      }

      frameCount++;
      if (frameCount % 10 === 0) {
        setTelemetry({
          yaw: Math.round(((yaw * 180) / Math.PI) % 360),
          pitch: Math.round((pitch * 180) / Math.PI),
        });
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [mesh]);

  return (
    <div className="zeus-card rounded-xl p-4 flex flex-col justify-between gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Move3d className="h-4 w-4 text-sky-400" />
            Planta 3D · Estudo Conceitual
          </h2>
          <p className="text-[11px] text-[var(--ink-subtle)]">{mesh.aspect}</p>
        </div>

        <div className="inline-flex rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] p-0.5 text-[11px]">
          {(["monoplano", "biplano", "asa_voadora"] as AircraftConcept[]).map((c) => {
            const active = concept === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setConcept(c)}
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                }`}
              >
                {CONCEPT_LABEL[c]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative rounded-lg border border-[var(--hairline)] bg-[#090c14] zeus-hud-grid overflow-hidden">
        <div className="pointer-events-none absolute top-2 left-2.5 flex items-center gap-2 font-mono text-[10px] text-sky-400/90">
          <span>ARQ: {CONCEPT_LABEL[concept].toUpperCase()}</span>
          <span className="text-amber-400/80">YAW {telemetry.yaw}°</span>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2.5 font-mono text-[10px] text-slate-400">
          Arraste para girar
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            rotationRef.current.dragging = true;
            rotationRef.current.lastX = e.clientX;
            rotationRef.current.lastY = e.clientY;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!rotationRef.current.dragging) return;
            const dx = e.clientX - rotationRef.current.lastX;
            const dy = e.clientY - rotationRef.current.lastY;
            rotationRef.current.lastX = e.clientX;
            rotationRef.current.lastY = e.clientY;
            rotationRef.current.yaw += dx * 0.01;
            rotationRef.current.pitch = Math.max(
              -1.1,
              Math.min(1.1, rotationRef.current.pitch + dy * 0.01)
            );
          }}
          onPointerUp={() => {
            rotationRef.current.dragging = false;
          }}
          onPointerCancel={() => {
            rotationRef.current.dragging = false;
          }}
          className="w-full h-52 cursor-grab active:cursor-grabbing touch-none block"
        />
      </div>

      <div className="text-[11px] text-[var(--ink-subtle)] flex items-center justify-between gap-2">
        <span>{mesh.note}</span>
        <span className="font-mono text-[10px] text-amber-500 shrink-0">Conceito aberto</span>
      </div>
    </div>
  );
}
