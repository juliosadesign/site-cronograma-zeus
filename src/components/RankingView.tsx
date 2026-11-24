"use client";

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ranking Anual & Perfis da Equipe</h1>
        <p className="text-xs text-[var(--ink-subtle)]">
          Pontuação ponderada pelas tarefas aprovadas em reunião (Crítica 4p · Alta 3p · Média 2p · Baixa 1p). Clique em qualquer membro para abrir o perfil completo.
        </p>
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
                        <div className="font-medium">{entry.member.fullName}</div>
                        {entry.member.inLabNow && (
                          <div className="text-[10px] text-emerald-400">Na sala agora</div>
                        )}
                      </div>
                    </div>
                  </td>
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
    </div>
  );
}
