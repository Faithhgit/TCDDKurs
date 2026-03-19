"use client";

import { type LeaderboardCategory } from "@/lib/leaderboard";

type LeaderboardMedalProps = {
  badge: "gold" | "silver" | "bronze" | null;
  category?: LeaderboardCategory;
  size?: "sm" | "lg";
};

function getRankNumber(badge: "gold" | "silver" | "bronze" | null) {
  if (badge === "gold") return "1";
  if (badge === "silver") return "2";
  if (badge === "bronze") return "3";
  return null;
}

function getApprovedEmoji(badge: "gold" | "silver" | "bronze" | null) {
  if (badge === "gold") return "🥇";
  if (badge === "silver") return "🥈";
  if (badge === "bronze") return "🥉";
  return null;
}

function getToneClasses(badge: "gold" | "silver" | "bronze" | null) {
  if (badge === "gold") {
    return {
      glow: "shadow-[0_10px_24px_rgba(245,158,11,0.22)]",
      ring: "border-amber-300/80",
      outer: "from-amber-500 via-yellow-300 to-amber-600",
      inner: "from-amber-50 to-yellow-100",
      text: "text-amber-900",
    };
  }

  if (badge === "silver") {
    return {
      glow: "shadow-[0_10px_24px_rgba(148,163,184,0.2)]",
      ring: "border-slate-300/80",
      outer: "from-slate-400 via-zinc-100 to-slate-500",
      inner: "from-slate-50 to-zinc-100",
      text: "text-slate-800",
    };
  }

  if (badge === "bronze") {
    return {
      glow: "shadow-[0_10px_24px_rgba(194,101,46,0.22)]",
      ring: "border-orange-300/80",
      outer: "from-orange-700 via-orange-300 to-amber-700",
      inner: "from-orange-50 to-amber-100",
      text: "text-orange-900",
    };
  }

  return null;
}

function SolvedBadge({
  badge,
  size,
}: {
  badge: "gold" | "silver" | "bronze";
  size: "sm" | "lg";
}) {
  const rank = getRankNumber(badge);
  const tone = getToneClasses(badge);
  const small = size === "sm";

  if (!rank || !tone) return null;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${small ? "h-6 w-6" : "h-16 w-16"} ${tone.glow}`}
      aria-hidden="true"
    >
      <span
        className={`absolute inset-0 rounded-[30%] border bg-gradient-to-br ${tone.outer} ${tone.ring} rotate-45`}
      />
      <span
        className={`absolute ${small ? "inset-[3px]" : "inset-[8px]"} rounded-[28%] border bg-gradient-to-br ${tone.inner} ${tone.ring} rotate-45`}
      />
      <span
        className={`relative inline-flex items-center justify-center rounded-full border border-white/70 bg-white/75 ${
          small ? "h-4 w-4 text-[10px]" : "h-9 w-9 text-xl"
        } font-black ${tone.text}`}
      >
        {rank}
      </span>
    </span>
  );
}

function CorrectBadge({
  badge,
  size,
}: {
  badge: "gold" | "silver" | "bronze";
  size: "sm" | "lg";
}) {
  const rank = getRankNumber(badge);
  const tone = getToneClasses(badge);
  const small = size === "sm";

  if (!rank || !tone) return null;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${small ? "h-6 w-6" : "h-16 w-16"} ${tone.glow}`}
      aria-hidden="true"
    >
      <span
        className={`absolute inset-0 border bg-gradient-to-br ${tone.outer} ${tone.ring}`}
        style={{
          clipPath: "polygon(50% 0%, 88% 14%, 88% 58%, 50% 100%, 12% 58%, 12% 14%)",
        }}
      />
      <span
        className={`absolute ${small ? "inset-[3px]" : "inset-[8px]"} border bg-gradient-to-br ${tone.inner} ${tone.ring}`}
        style={{
          clipPath: "polygon(50% 2%, 84% 16%, 84% 56%, 50% 96%, 16% 56%, 16% 16%)",
        }}
      />
      <span
        className={`relative inline-flex items-center justify-center ${
          small ? "text-[10px]" : "text-2xl"
        } font-black ${tone.text}`}
      >
        {rank}
      </span>
    </span>
  );
}

function QuizBadge({
  badge,
  size,
}: {
  badge: "gold" | "silver" | "bronze";
  size: "sm" | "lg";
}) {
  const rank = getRankNumber(badge);
  const tone = getToneClasses(badge);
  const small = size === "sm";

  if (!rank || !tone) return null;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${small ? "h-6 w-6" : "h-16 w-16"} ${tone.glow}`}
      aria-hidden="true"
    >
      <span className={`absolute inset-0 rounded-full border bg-gradient-to-br ${tone.outer} ${tone.ring}`} />
      <span className={`absolute ${small ? "inset-[3px]" : "inset-[8px]"} rounded-full border bg-white/90 ${tone.ring}`} />
      <span
        className={`relative inline-flex items-center justify-center ${small ? "text-[10px]" : "text-xl"} font-black ${tone.text}`}
      >
        {rank}
      </span>
    </span>
  );
}

export default function LeaderboardMedal({
  badge,
  category = "approved",
  size = "sm",
}: LeaderboardMedalProps) {
  if (!badge) return null;

  const small = size === "sm";

  if (category === "approved") {
    return (
      <span
        className={`inline-flex items-center justify-center ${small ? "h-6 min-w-7 text-[19px] leading-none" : "h-16 min-w-16 text-5xl"}`}
        aria-hidden="true"
      >
        {getApprovedEmoji(badge)}
      </span>
    );
  }

  if (category === "solved") {
    return <SolvedBadge badge={badge} size={size} />;
  }

  if (category === "correct") {
    return <CorrectBadge badge={badge} size={size} />;
  }

  return <QuizBadge badge={badge} size={size} />;
}
