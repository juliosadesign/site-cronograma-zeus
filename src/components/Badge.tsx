"use client";

import { Code2, Crown, Shield, Sparkles, User, UserCheck } from "lucide-react";
import {
  AREA_ROLE_META,
  getAreaMeta,
  PRIORITY_META,
  ROLE_META,
  TASK_STATUS_META,
} from "@/lib/domain";
import type { AreaRole, Priority, Role, TaskStatus } from "@/lib/types";

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

export function AreaRoleBadge({ role, areaId }: { role: AreaRole; areaId?: string }) {
  const roleMeta = AREA_ROLE_META[role];
  const areaMeta = areaId ? getAreaMeta(areaId) : null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleMeta.badgeClass}`}
    >
      {areaMeta && (
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: areaMeta.colorHex }}
        />
      )}
      {areaMeta ? `${areaMeta.shortCode} · ` : ""}
      {roleMeta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      title={meta.eisenhower}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-medium ${meta.badgeClass}`}
    >
      <Sparkles className="h-2.5 w-2.5" />
      {meta.label}
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

export function AreaChip({
  areaId,
  subtle,
  showName,
}: {
  areaId: string;
  subtle?: boolean;
  showName?: boolean;
}) {
  const meta = getAreaMeta(areaId);
  return (
    <span
      title={meta.name}
      className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-tight ${
        subtle ? `${meta.chipClass} opacity-85` : meta.chipClass
      }`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: meta.colorHex }}
      />
      {showName ? `${meta.shortCode} · ${meta.name}` : meta.shortCode}
    </span>
  );
}
