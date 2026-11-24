"use client";

import { getInitials } from "@/lib/domain";
import type { Member } from "@/lib/types";

const SIZE_CLASS = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-16 w-16 text-lg",
};

const DOT_CLASS = {
  sm: "h-2 w-2 right-0 bottom-0",
  md: "h-2.5 w-2.5 right-0 bottom-0",
  lg: "h-3.5 w-3.5 right-0.5 bottom-0.5",
};

export function MemberAvatar({
  member,
  size = "sm",
  showPresence = true,
}: {
  member: Member;
  size?: "sm" | "md" | "lg";
  showPresence?: boolean;
}) {
  return (
    <span className="relative inline-flex shrink-0">
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt={member.fullName}
          className={`${SIZE_CLASS[size]} rounded-full object-cover border border-[var(--hairline-strong)] bg-[var(--surface-2)]`}
        />
      ) : (
        <span
          className={`${SIZE_CLASS[size]} rounded-full border border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--ink)] font-mono font-semibold flex items-center justify-center`}
        >
          {getInitials(member.fullName)}
        </span>
      )}
      {showPresence && member.inLabNow && (
        <span
          title="Na sala agora"
          className={`absolute ${DOT_CLASS[size]} rounded-full bg-emerald-500 ring-2 ring-[var(--surface-1)]`}
        />
      )}
    </span>
  );
}
