"use client";

import { useState } from "react";
import { Award, CalendarCheck, CheckCheck, X } from "lucide-react";
import {
  computeAttendanceStats,
  computeMemberPoints,
  getAreaName,
  ROLE_META,
} from "@/lib/domain";
import { useZeus } from "@/lib/store";
import { AreaChip, PriorityBadge, RoleBadge, StatusBadge } from "./Badge";

export function RankingView() {
  const { state } = useZeus();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const approvedMembers = state.members.filter((m) => m.accountStatus === "approved");

  const ranked = approvedMembers
    .map((m) => {
      const points = computeMemberPoints(m.id, state.tasks);
      const myTasks = state.tasks.filter((t) => t.assigneeId === m.id);
      const approvedTasks = myTasks.filter((t) => t.meetingApproved);
      const att = computeAttendanceStats(m.id, state.attendance);
      return { member: m, points, myTasks, approvedTasks, att };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.att.rate !== a.att.rate) return b.att.rate - a.att.rate;
      return ROLE_META[a.member.role].rankOrder - ROLE_META[b.member.role].rankOrder;
    });

  const selectedEntry = ranked.find((r) => r.member.id === selectedMemberId) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ranking Anual & Perfis da Equipe</h1>
        <p className="text-xs text-[var(--ink-subtle)]">
          Pontuação ponderada pelas tarefas aprovadas em reunião (Crítica 4p · Alta 3p · Média 2p · Baixa 1p). Clique em qualquer membro para abrir o histórico completo.
        </p>
      </div>

      <div className="zeus-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]">
              <tr>
                <th className="py-2.5 px-3 font-medium">#</th>
                <th className="py-2.5 px-3 font-medium">Membro</th>
                <th className="py-2.5 px-3 font-medium">Patente</th>
                <th className="py-2.5 px-3 font-medium">Áreas</th>
                <th className="py-2.5 px-3 font-medium text-right">Sprints Aprov.</th>
                <th className="py-2.5 px-3 font-medium text-right">Presença</th>
                <th className="py-2.5 px-3 font-medium text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {ranked.map((entry, idx) => (
                <tr
                  key={entry.member.id}
                  onClick={() => setSelectedMemberId(entry.member.id)}
                  className="cursor-pointer hover:bg-[var(--surface-2)]/60 transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-semibold text-amber-500">
                    {idx + 1}º
                  </td>
                  <td className="py-3 px-3 font-medium">{entry.member.fullName}</td>
                  <td className="py-3 px-3">
                    <RoleBadge role={entry.member.role} />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {entry.member.areaIds.map((id) => (
                        <AreaChip key={id} areaId={id} />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {entry.approvedTasks.length}/{entry.myTasks.length}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {entry.att.present}/{entry.att.total} ({entry.att.rate}%)
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    {entry.points} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Profile Detail */}
      {selectedEntry && (
        <div className="zeus-card rounded-lg p-5 space-y-4 border-amber-500/40">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">{selectedEntry.member.fullName}</h2>
                <RoleBadge role={selectedEntry.member.role} />
              </div>
              <div className="text-xs text-[var(--ink-subtle)]">{selectedEntry.member.email}</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedEntry.member.areaIds.map((id) => (
                  <span
                    key={id}
                    className="rounded border border-[var(--hairline)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px]"
                  >
                    {getAreaName(id)}
                    {selectedEntry.member.directorAreaIds.includes(id) ? " (Diretor)" : ""}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedMemberId(null)}
              className="rounded-md border border-[var(--hairline)] p-1.5 text-[var(--ink-subtle)] hover:text-[var(--ink)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="zeus-surface-2 rounded-md p-3 border border-[var(--hairline)]">
              <div className="text-[11px] text-[var(--ink-subtle)] flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-500" /> Pontos no Ano
              </div>
              <div className="mt-1 font-mono text-lg font-semibold">{selectedEntry.points} pts</div>
            </div>
            <div className="zeus-surface-2 rounded-md p-3 border border-[var(--hairline)]">
              <div className="text-[11px] text-[var(--ink-subtle)] flex items-center gap-1">
                <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> Entregas Aprovadas
              </div>
              <div className="mt-1 font-mono text-lg font-semibold">
                {selectedEntry.approvedTasks.length}
              </div>
            </div>
            <div className="zeus-surface-2 rounded-md p-3 border border-[var(--hairline)]">
              <div className="text-[11px] text-[var(--ink-subtle)] flex items-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-sky-500" /> Presença Reuniões
              </div>
              <div className="mt-1 font-mono text-lg font-semibold">
                {selectedEntry.att.present}x ({selectedEntry.att.rate}%)
              </div>
              <div className="text-[10px] text-[var(--ink-subtle)]">
                {selectedEntry.att.justified} justif. · {selectedEntry.att.absent} falta(s)
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-[var(--ink-subtle)] uppercase tracking-wider">
              Histórico de Sprints do Membro
            </h3>
            {selectedEntry.myTasks.length === 0 ? (
              <div className="text-xs text-[var(--ink-subtle)]">Nenhuma tarefa atribuída ainda.</div>
            ) : (
              <div className="space-y-1.5">
                {selectedEntry.myTasks.map((t) => {
                  const sp = state.sprints.find((s) => s.id === t.sprintId);
                  return (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--hairline)] p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{t.title}</div>
                        <div className="text-[11px] text-[var(--ink-subtle)]">
                          {sp?.name ?? "Sprint"} · {getAreaName(t.areaId)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                        {t.meetingApproved && (
                          <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px]">
                            Oficializado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
