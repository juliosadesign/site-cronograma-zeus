"use client";

import { useState } from "react";
import { computeAttendanceStats, computeMemberPoints, ROLE_META } from "@/lib/domain";
import { useZeus } from "@/lib/store";
import { AreaChip, RoleBadge } from "./Badge";
import { MemberAvatar } from "./MemberAvatar";

export function RankingView({
  onOpenProfile,
}: {
  onOpenProfile: (memberId: string) => void;
}) {
  const { state } = useZeus();
  const [scope, setScope] = useState<"season" | "all">("season");
  const approvedMembers = state.members.filter((m) => m.accountStatus === "approved");

  const seasonSprintIds = new Set(
    state.sprints.filter((s) => s.seasonYear === state.activeSeason).map((s) => s.id)
  );
  const seasonMeetingIds = new Set(
    state.meetings.filter((m) => m.seasonYear === state.activeSeason).map((m) => m.id)
  );

  const scopedTasks =
    scope === "season"
      ? state.tasks.filter((t) => seasonSprintIds.has(t.sprintId))
      : state.tasks;
  const scopedAttendance =
    scope === "season"
      ? state.attendance.filter((a) => seasonMeetingIds.has(a.meetingId))
      : state.attendance;

  const ranked = approvedMembers
    .map((m) => {
      const points = computeMemberPoints(m.id, scopedTasks);
      const myTasks = scopedTasks.filter((t) => t.assigneeId === m.id);
      const approvedTasks = myTasks.filter((t) => t.meetingApproved);
      const att = computeAttendanceStats(m.id, scopedAttendance);
      return { member: m, points, myTasks, approvedTasks, att };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.att.rate !== a.att.rate) return b.att.rate - a.att.rate;
      return ROLE_META[a.member.role].rankOrder - ROLE_META[b.member.role].rankOrder;
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Ranking & Perfis da Equipe</h1>
          <p className="text-xs text-[var(--ink-subtle)]">
            Pontuação ponderada pelas tarefas aprovadas em reunião (Crítica 4p · Alta 3p · Média 2p · Baixa 1p). Clique em qualquer membro para abrir o perfil.
          </p>
        </div>

        <div className="inline-flex self-start rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-2)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setScope("season")}
            className={`rounded-md px-2.5 py-1 font-medium ${
              scope === "season" ? "bg-blue-600 text-white" : "text-[var(--ink-subtle)]"
            }`}
          >
            ZEUS {state.activeSeason}
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`rounded-md px-2.5 py-1 font-medium ${
              scope === "all" ? "bg-blue-600 text-white" : "text-[var(--ink-subtle)]"
            }`}
          >
            Histórico Geral
          </button>
        </div>
      </div>

      <div className="zeus-card rounded-xl overflow-hidden">
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
                  onClick={() => onOpenProfile(entry.member.id)}
                  className="cursor-pointer hover:bg-[var(--surface-2)]/60 transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-semibold text-amber-500">
                    {idx + 1}º
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <MemberAvatar member={entry.member} size="sm" />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 font-medium">
                          <span>{entry.member.fullName}</span>
                          {entry.member.isGhost && (
                            <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-medium text-violet-300">
                              Fantasma
                            </span>
                          )}
                        </div>
                        {entry.member.inLabNow && (
                          <div className="text-[10px] text-emerald-400">Na sala agora</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {entry.member.isGhost && !entry.member.roleConfirmed ? (
                      <span className="text-[11px] text-[var(--ink-subtle)]">—</span>
                    ) : (
                      <RoleBadge role={entry.member.role} />
                    )}
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
    </div>
  );
}
