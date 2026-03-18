"use client";

import { useEffect, useRef, useState } from "react";

import { type LeaderboardEntry } from "@/lib/leaderboard";

type LeaderboardBadgeProps = {
  badge: LeaderboardEntry["badge"];
  className?: string;
};

function getBadgeMeta(badge: LeaderboardEntry["badge"]) {
  if (badge === "gold") {
    return {
      emoji: "🥇",
      label: "Soru ekleme sıralamasında 1.",
    };
  }

  if (badge === "silver") {
    return {
      emoji: "🥈",
      label: "Soru ekleme sıralamasında 2.",
    };
  }

  if (badge === "bronze") {
    return {
      emoji: "🥉",
      label: "Soru ekleme sıralamasında 3.",
    };
  }

  return null;
}

export default function LeaderboardBadge({ badge, className = "" }: LeaderboardBadgeProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const meta = getBadgeMeta(badge);

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
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm shadow-[var(--shadow-soft)]"
        aria-label={meta.label}
      >
        {meta.emoji}
      </button>

      {open ? (
        <div className="absolute left-1/2 top-full z-10 mt-2 w-max max-w-44 -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_98%,white)] px-3 py-2 text-[11px] font-medium text-[var(--foreground)] shadow-[var(--shadow-strong)]">
          {meta.label}
        </div>
      ) : null}
    </div>
  );
}
