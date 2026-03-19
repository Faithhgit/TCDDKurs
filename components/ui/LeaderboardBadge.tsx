"use client";

import { useEffect, useRef, useState } from "react";

import LeaderboardMedal from "@/components/ui/LeaderboardMedal";
import { type LeaderboardCategory, type LeaderboardEntry, type RankedLeaderboardEntry } from "@/lib/leaderboard";

type BadgeType = LeaderboardEntry["badge"] | RankedLeaderboardEntry["badge"];

type LeaderboardBadgeProps = {
  badge: BadgeType;
  category?: LeaderboardCategory;
  className?: string;
  label?: string;
};

function getBadgeMeta(badge: BadgeType, label?: string) {
  if (badge === "gold") return { label: label ?? "Sıralamada 1." };
  if (badge === "silver") return { label: label ?? "Sıralamada 2." };
  if (badge === "bronze") return { label: label ?? "Sıralamada 3." };
  return null;
}

export default function LeaderboardBadge({
  badge,
  category = "approved",
  className = "",
  label,
}: LeaderboardBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const meta = getBadgeMeta(badge, label);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!meta) return null;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center justify-center rounded-full"
        aria-label={meta.label}
      >
        <LeaderboardMedal badge={badge} category={category} size="sm" />
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-10 mt-2 w-max max-w-44 -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_98%,white)] px-3 py-2 text-[11px] font-medium text-[var(--foreground)] shadow-[var(--shadow-strong)]">
          {meta.label}
        </div>
      ) : null}
    </div>
  );
}
