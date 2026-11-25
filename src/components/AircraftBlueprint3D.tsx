"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Move3d } from "lucide-react";
import { computeConceptVoteTally } from "@/lib/domain";
import { useZeus } from "@/lib/store";
import type { AircraftConcept } from "@/lib/types";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  a: number;
  b: number;
  role: "primary" | "secondary" | "axis" | "prop";
}

interface Mesh {
  vertices: Vec3[];
  edges: Edge[];
  propCenter?: Vec3;
  propRadius?: number;
  note: string;
  aspect: string;
}

const CONCEPT_LABEL: Record<AircraftConcept, string> = {
  monoplano: "Monoplano",
  biplano: "Biplano",
  asa_voadora: "Asa Voadora",
};

function buildOctagonalFuselage(v: Vec3[], e: Edge[], length: number) {
  const nose = v.length;
  v.push({ x: length * 0.58, y: 0.01, z: 0 });
  const stations = [
    { x: length * 0.42, rx: 0.11, ry: 0.11, yOff: 0.01 },
    { x: length * 0.24, rx: 0.16, ry: 0.17, yOff: 0.03 },
    { x: length * 0.05, rx: 0.17, ry: 0.19, yOff: 0.04 },
    { x: -length * 0.16, rx: 0.14, ry: 0.14, yOff: 0.02 },
    { x: -length * 0.36, rx: 0.09, ry: 0.1, yOff: 0.01 },
    { x: -length * 0.54, rx: 0.04, ry: 0.06, yOff: 0.02 },
  ];

  const rings: number[][] = [];
  for (const st of stations) {
    const ring: number[] = [];
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2;
      const idx = v.length;
      v.push({
        x: st.x,
        y: st.yOff + Math.sin(ang) * st.ry,
        z: Math.cos(ang) * st.rx,
      });
      ring.push(idx);
    }
    rings.push(ring);
    for (let k = 0; k < 8; k++) {
      e.push({ a: ring[k], b: ring[(k + 1) % 8], role: "secondary" });
    }
  }

  for (const idx of rings[0]) {
    e.push({ a: nose, b: idx, role: "primary" });
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let k = 0; k < 8; k++) {
      e.push({
        a: rings[r][k],
        b: rings[r + 1][k],
        role: k % 2 === 0 ? "primary" : "secondary",
      });
    }
  }

  // Cockpit fairing ridge
  const ck1 = v.length;
  v.push({ x: length * 0.3, y: 0.24, z: 0 });
  const ck2 = v.length;
  v.push({ x: length * 0.1, y: 0.27, z: 0 });
  const ck3 = v.length;
  v.push({ x: -length * 0.05, y: 0.21, z: 0 });
  e.push({ a: rings[0][2], b: ck1, role: "axis" });
  e.push({ a: ck1, b: ck2, role: "axis" });
  e.push({ a: ck2, b: ck3, role: "axis" });
  e.push({ a: ck3, b: rings[3][2], role: "axis" });

  // Centerline axis
  e.push({ a: nose, b: rings[rings.length - 1][2], role: "axis" });
}

function addLandingGear(v: Vec3[], e: Edge[], xMain: number, xNose: number) {
  const addWheel = (wx: number, wy: number, wz: number, r: number) => {
    const pts: number[] = [];
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2;
      const idx = v.length;
      v.push({ x: wx + Math.cos(ang) * r, y: wy + Math.sin(ang) * r, z: wz });
      pts.push(idx);
    }
    for (let k = 0; k < 6; k++) {
      e.push({ a: pts[k], b: pts[(k + 1) % 6], role: "axis" });
    }
    return pts[1];
  };

  const attachL = v.length;
  v.push({ x: xMain, y: -0.06, z: 0.09 });
  const attachR = v.length;
  v.push({ x: xMain, y: -0.06, z: -0.09 });
  const attachN = v.length;
  v.push({ x: xNose, y: -0.08, z: 0 });

  const wl = addWheel(xMain - 0.04, -0.34, 0.24, 0.065);
  const wr = addWheel(xMain - 0.04, -0.34, -0.24, 0.065);
  const wn = addWheel(xNose + 0.04, -0.34, 0, 0.05);

  e.push({ a: attachL, b: wl, role: "primary" });
  e.push({ a: attachR, b: wr, role: "primary" });
  e.push({ a: attachN, b: wn, role: "primary" });
}

function addDetailedWing(
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
    ribs: number;
    thickness?: number;
  }
): { tipLeft: [number, number]; tipRight: [number, number]; strutPts: number[] } {
  const half = opts.span / 2;
  const n = opts.ribs;
  const thick = opts.thickness ?? 0.055;
  const leIdx: number[] = [];
  const teIdx: number[] = [];
  const up1Idx: number[] = [];
  const up2Idx: number[] = [];
  const loIdx: number[] = [];

  for (let i = -n; i <= n; i++) {
    const t = Math.abs(i) / n;
    const z = (i / n) * half;
    const chord = opts.rootChord + (opts.tipChord - opts.rootChord) * t;
    const leX = opts.xCenter + chord * 0.5 - t * opts.sweep;
    const teX = leX - chord;
    const y = opts.yOffset + t * opts.dihedral;
    const h = thick * (1 - 0.35 * t);

    const le = v.length;
    v.push({ x: leX, y: y + h * 0.2, z });
    const u1 = v.length;
    v.push({ x: leX - chord * 0.28, y: y + h, z });
    const u2 = v.length;
    v.push({ x: leX - chord * 0.62, y: y + h * 0.65, z });
    const te = v.length;
    v.push({ x: teX, y, z });
    const lo = v.length;
    v.push({ x: leX - chord * 0.35, y: y - h * 0.32, z });

    leIdx.push(le);
    up1Idx.push(u1);
    up2Idx.push(u2);
    teIdx.push(te);
    loIdx.push(lo);

    // Closed airfoil rib loop
    e.push({ a: le, b: u1, role: "secondary" });
    e.push({ a: u1, b: u2, role: "secondary" });
    e.push({ a: u2, b: te, role: "secondary" });
    e.push({ a: te, b: lo, role: "secondary" });
    e.push({ a: lo, b: le, role: "secondary" });
  }

  for (let i = 0; i < leIdx.length - 1; i++) {
    e.push({ a: leIdx[i], b: leIdx[i + 1], role: "primary" });
    e.push({ a: up1Idx[i], b: up1Idx[i + 1], role: "axis" });
    e.push({ a: up2Idx[i], b: up2Idx[i + 1], role: "secondary" });
    e.push({ a: teIdx[i], b: teIdx[i + 1], role: "primary" });
    e.push({ a: loIdx[i], b: loIdx[i + 1], role: "secondary" });
  }

  const midLeft = Math.max(0, Math.floor(n * 0.35));
  const midRight = leIdx.length - 1 - midLeft;
  return {
    tipLeft: [leIdx[0], teIdx[0]],
    tipRight: [leIdx[leIdx.length - 1], teIdx[teIdx.length - 1]],
    strutPts: [leIdx[midLeft], teIdx[midLeft], leIdx[midRight], teIdx[midRight]],
  };
}

function addEmpennage(v: Vec3[], e: Edge[], xTail: number, yBase: number) {
  addDetailedWing(v, e, {
    xCenter: xTail,
    yOffset: yBase + 0.04,
    span: 0.96,
    rootChord: 0.28,
    tipChord: 0.17,
    sweep: 0.07,
    dihedral: 0,
    ribs: 3,
    thickness: 0.025,
  });

  // Detailed swept vertical stabilizer + rudder spar
  const b0 = v.length;
  v.push({ x: xTail + 0.16, y: yBase + 0.04, z: 0 });
  v.push({ x: xTail - 0.16, y: yBase + 0.04, z: 0 });
  v.push({ x: xTail - 0.02, y: yBase + 0.44, z: 0 });
  v.push({ x: xTail - 0.2, y: yBase + 0.41, z: 0 });
  v.push({ x: xTail - 0.02, y: yBase + 0.04, z: 0 });
  v.push({ x: xTail - 0.11, y: yBase + 0.425, z: 0 });

  e.push({ a: b0, b: b0 + 2, role: "primary" });
  e.push({ a: b0 + 2, b: b0 + 3, role: "primary" });
  e.push({ a: b0 + 3, b: b0 + 1, role: "primary" });
  e.push({ a: b0, b: b0 + 1, role: "secondary" });
  e.push({ a: b0 + 4, b: b0 + 5, role: "axis" });
}

function buildMesh(concept: AircraftConcept): Mesh {
  const vertices: Vec3[] = [];
  const edges: Edge[] = [];

  if (concept === "monoplano") {
    buildOctagonalFuselage(vertices, edges, 2.25);
    addLandingGear(vertices, edges, 0.12, 0.88);
    addDetailedWing(vertices, edges, {
      xCenter: 0.25,
      yOffset: 0.16,
      span: 2.85,
      rootChord: 0.5,
      tipChord: 0.29,
      sweep: 0.09,
      dihedral: 0.09,
      ribs: 6,
    });
    addEmpennage(vertices, edges, -0.98, 0.04);
    return {
      vertices,
      edges,
      propCenter: { x: 1.32, y: 0.01, z: 0 },
      propRadius: 0.28,
      aspect: "AR ~8.4 · Trem triciclo + asa alta/média",
      note: "Arquitetura clássica: menor arrasto induzido e previsibilidade em decolagem.",
    };
  }

  if (concept === "biplano") {
    buildOctagonalFuselage(vertices, edges, 2.08);
    addLandingGear(vertices, edges, 0.14, 0.82);
    const upper = addDetailedWing(vertices, edges, {
      xCenter: 0.29,
      yOffset: 0.36,
      span: 2.35,
      rootChord: 0.39,
      tipChord: 0.31,
      sweep: 0.04,
      dihedral: 0.03,
      ribs: 5,
    });
    const lower = addDetailedWing(vertices, edges, {
      xCenter: 0.15,
      yOffset: -0.07,
      span: 2.25,
      rootChord: 0.39,
      tipChord: 0.31,
      sweep: 0.04,
      dihedral: 0.05,
      ribs: 5,
    });
    // Interplane N-struts & diagonal X-rigging wires
    for (let i = 0; i < upper.strutPts.length; i++) {
      edges.push({ a: upper.strutPts[i], b: lower.strutPts[i], role: "axis" });
    }
    edges.push({ a: upper.strutPts[0], b: lower.strutPts[1], role: "secondary" });
    edges.push({ a: upper.strutPts[2], b: lower.strutPts[3], role: "secondary" });
    addEmpennage(vertices, edges, -0.94, 0.04);
    return {
      vertices,
      edges,
      propCenter: { x: 1.22, y: 0.01, z: 0 },
      propRadius: 0.27,
      aspect: "2 planos + montantes em N · Envergadura compacta",
      note: "Maximiza área alar dentro das restrições de caixa do regulamento SAE.",
    };
  }

  // Asa Voadora com fuselagem central integrada e hélice pusher
  const pod0 = vertices.length;
  vertices.push({ x: 0.54, y: 0.02, z: 0 });
  vertices.push({ x: 0.16, y: 0.17, z: 0 });
  vertices.push({ x: -0.36, y: 0.05, z: 0 });
  vertices.push({ x: 0.12, y: -0.09, z: 0 });
  edges.push({ a: pod0, b: pod0 + 1, role: "axis" });
  edges.push({ a: pod0 + 1, b: pod0 + 2, role: "axis" });
  edges.push({ a: pod0 + 2, b: pod0 + 3, role: "secondary" });
  edges.push({ a: pod0 + 3, b: pod0, role: "secondary" });

  const wing = addDetailedWing(vertices, edges, {
    xCenter: 0.22,
    yOffset: 0.01,
    span: 2.8,
    rootChord: 0.72,
    tipChord: 0.25,
    sweep: 0.62,
    dihedral: 0.08,
    ribs: 6,
    thickness: 0.07,
  });

  // Canted wingtip winglets with intermediate rib
  for (const [leIdx, teIdx] of [wing.tipLeft, wing.tipRight]) {
    const le = vertices[leIdx];
    const te = vertices[teIdx];
    const signZ = Math.sign(le.z) || 1;
    const midLe = vertices.length;
    vertices.push({ x: le.x - 0.05, y: le.y + 0.17, z: le.z + signZ * 0.03 });
    const midTe = vertices.length;
    vertices.push({ x: te.x - 0.06, y: te.y + 0.16, z: te.z + signZ * 0.03 });
    const topLe = vertices.length;
    vertices.push({ x: le.x - 0.1, y: le.y + 0.34, z: le.z + signZ * 0.06 });
    const topTe = vertices.length;
    vertices.push({ x: te.x - 0.13, y: te.y + 0.31, z: te.z + signZ * 0.06 });

    edges.push({ a: leIdx, b: midLe, role: "primary" });
    edges.push({ a: midLe, b: topLe, role: "primary" });
    edges.push({ a: teIdx, b: midTe, role: "primary" });
    edges.push({ a: midTe, b: topTe, role: "primary" });
    edges.push({ a: midLe, b: midTe, role: "secondary" });
    edges.push({ a: topLe, b: topTe, role: "primary" });
  }

  return {
    vertices,
    edges,
    propCenter: { x: -0.4, y: 0.04, z: 0 },
    propRadius: 0.23,
    aspect: "Enflechada + Winglets + Pusher · Peso vazio reduzido",
    note: "Menor arrasto parasita; exige ajuste fino de CG e estabilidade direcional.",
  };
}

export function AircraftBlueprint3D() {
  const { state, currentUser, voteAircraftConcept } = useZeus();
  const [concept, setConcept] = useState<AircraftConcept>("monoplano");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef({
    yaw: -0.65,
    pitch: 0.42,
    propAngle: 0,
    scanY: 0,
    morphScale: 0.92,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });
  const [telemetry, setTelemetry] = useState({ yaw: -37, pitch: 24 });

  const mesh = useMemo(() => buildMesh(concept), [concept]);
  const tally = useMemo(() => computeConceptVoteTally(state.conceptVotes), [state.conceptVotes]);
  const totalVotes = tally.monoplano + tally.biplano + tally.asa_voadora;
  const myVote = state.conceptVotes[currentUser.id];

  useEffect(() => {
    rotationRef.current.morphScale = 0.88;
  }, [concept]);

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
      const height = Math.max(200, Math.round(rect.height));

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const st = rotationRef.current;
      if (!st.dragging && !reducedMotion) {
        st.yaw += 0.0055;
      }
      if (!reducedMotion) {
        st.propAngle += 0.34;
        st.scanY = (st.scanY + 0.9) % height;
      }
      st.morphScale += (1 - st.morphScale) * 0.14;

      const cosY = Math.cos(st.yaw);
      const sinY = Math.sin(st.yaw);
      const cosP = Math.cos(st.pitch);
      const sinP = Math.sin(st.pitch);

      const cx = width / 2;
      const cy = height / 2 + 6;
      const scale = Math.min(width, height) * 0.45 * st.morphScale;
      const fov = 4.4;

      // Ground telemetry rings + crosshairs
      ctx.strokeStyle = "rgba(56, 189, 248, 0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 32, scale * 1.18, scale * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(245, 158, 11, 0.12)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + 32, scale * 0.72, scale * 0.21, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Project vertices + dynamic spinning propeller blades
      const allVerts = [...mesh.vertices];
      const extraEdges: Edge[] = [];
      if (mesh.propCenter && mesh.propRadius) {
        const pc = mesh.propCenter;
        const pr = mesh.propRadius;
        const pCenterIdx = allVerts.length;
        allVerts.push(pc);
        for (let b = 0; b < 2; b++) {
          const ang = st.propAngle + b * Math.PI;
          const tipIdx = allVerts.length;
          allVerts.push({
            x: pc.x,
            y: pc.y + Math.sin(ang) * pr,
            z: pc.z + Math.cos(ang) * pr,
          });
          extraEdges.push({ a: pCenterIdx, b: tipIdx, role: "prop" });
        }
      }

      const projected = allVerts.map((pt) => {
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

      const allEdges = [...mesh.edges, ...extraEdges];
      for (const edge of allEdges) {
        const p1 = projected[edge.a];
        const p2 = projected[edge.b];
        if (!p1 || !p2) continue;

        const avgDepth = (p1.depth + p2.depth) * 0.5;
        const depthFactor = Math.max(0.35, Math.min(1, 0.68 + avgDepth * 0.22));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (edge.role === "prop") {
          ctx.strokeStyle = "rgba(251, 191, 36, 0.95)";
          ctx.lineWidth = 2;
        } else if (edge.role === "axis") {
          ctx.strokeStyle = `rgba(245, 158, 11, ${(0.88 * depthFactor).toFixed(2)})`;
          ctx.lineWidth = 1.45;
        } else if (edge.role === "primary") {
          ctx.strokeStyle = `rgba(56, 189, 248, ${(0.95 * depthFactor).toFixed(2)})`;
          ctx.lineWidth = 1.55;
        } else {
          ctx.strokeStyle = `rgba(59, 130, 246, ${(0.42 * depthFactor).toFixed(2)})`;
          ctx.lineWidth = 0.95;
        }
        ctx.stroke();
      }

      // Highlight key structural nodes
      for (let i = 0; i < mesh.vertices.length; i += 4) {
        const p = projected[i];
        ctx.fillStyle = p.depth > 0 ? "rgba(251, 191, 36, 0.85)" : "rgba(56, 189, 248, 0.45)";
        ctx.fillRect(p.x - 1, p.y - 1, 2.2, 2.2);
      }

      // Subtle HUD scanline sweep
      if (!reducedMotion) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, st.scanY);
        ctx.lineTo(width, st.scanY);
        ctx.stroke();
      }

      frameCount++;
      if (frameCount % 10 === 0) {
        setTelemetry({
          yaw: Math.round(((st.yaw * 180) / Math.PI) % 360),
          pitch: Math.round((st.pitch * 180) / Math.PI),
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
          {mesh.vertices.length} nós · Arraste para girar
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

      <div className="text-[11px] text-[var(--ink-subtle)]">{mesh.note}</div>

      {/* Fun team poll */}
      <div className="pt-2.5 border-t border-[var(--hairline)] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-amber-500" />
            Qual dos 3 você mais gosta? <span className="text-[var(--ink-subtle)]">(só pela resenha)</span>
          </span>
          <span className="font-mono text-[10px] text-[var(--ink-subtle)]">
            {totalVotes} voto(s)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["monoplano", "biplano", "asa_voadora"] as AircraftConcept[]).map((c) => {
            const votes = tally[c];
            const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
            const picked = myVote === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setConcept(c);
                  voteAircraftConcept(c);
                }}
                className={`zeus-btn rounded-lg border px-2 py-1.5 text-left transition-colors ${
                  picked
                    ? "border-amber-500 bg-amber-500/15"
                    : "border-[var(--hairline)] bg-[var(--surface-2)]/70 hover:border-[var(--hairline-strong)]"
                }`}
              >
                <div className="text-[11px] font-medium truncate">{CONCEPT_LABEL[c]}</div>
                <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] text-[var(--ink-subtle)]">
                  <span>{votes}</span>
                  <span className={picked ? "text-amber-400 font-semibold" : ""}>{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
