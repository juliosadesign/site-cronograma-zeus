"use client";

import { Code2, Crown, Shield, Sparkles, UserCheck, User } from "lucide-react";
import { getAreaCode, PRIORITY_META, ROLE_META, TASK_STATUS_META } from "@/lib/domain";
import type { Priority, Role, TaskStatus } from "@/lib/types";

const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  desenvolvedor: Code2,
  capitao: Crown,
  cocapitao: Crown,
  diretor: Shield,
  efetivado: UserCheck,
  calouro: User,
};

export function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  const Icon = ROLE_ICON[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      title={`${meta.eisenhower} (${meta.points} pts)`}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium ${meta.badgeClass}`}
    >
      <Sparkles className="h-2.5 w-2.5" />
      {meta.label} · {meta.points}p
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.pillClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

export function AreaChip({ areaId, subtle }: { areaId: string; subtle?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-tight ${
        subtle
          ? "border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]"
          : "border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--ink-muted)]"
      }`}
    >
      {getAreaCode(areaId)}
    </span>
  );
}
