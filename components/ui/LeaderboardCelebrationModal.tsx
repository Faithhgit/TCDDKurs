"use client";

type LeaderboardCelebrationModalProps = {
  open: boolean;
  rank: 1 | 2 | 3 | null;
  onClose: () => void;
};

const confettiItems = [
  { left: "8%", delay: "0s", duration: "4.2s", color: "#f59e0b", rotate: "-12deg" },
  { left: "18%", delay: "0.3s", duration: "4.8s", color: "#10b981", rotate: "8deg" },
  { left: "28%", delay: "0.8s", duration: "4.4s", color: "#60a5fa", rotate: "-8deg" },
  { left: "42%", delay: "0.1s", duration: "4.6s", color: "#f97316", rotate: "12deg" },
  { left: "54%", delay: "0.6s", duration: "4.1s", color: "#facc15", rotate: "-10deg" },
  { left: "66%", delay: "0.2s", duration: "4.9s", color: "#a78bfa", rotate: "10deg" },
  { left: "78%", delay: "0.7s", duration: "4.3s", color: "#fb7185", rotate: "-6deg" },
  { left: "90%", delay: "0.4s", duration: "4.7s", color: "#34d399", rotate: "6deg" },
];

function getRankMeta(rank: 1 | 2 | 3 | null) {
  if (rank === 1) {
    return {
      emoji: "🥇",
      title: "Tebrikler",
      subtitle: "Soru ekleme sıralamasında 1. sıradasın.",
      value: "1.",
    };
  }

  if (rank === 2) {
    return {
      emoji: "🥈",
      title: "Tebrikler",
      subtitle: "Soru ekleme sıralamasında 2. sıradasın.",
      value: "2.",
    };
  }

  if (rank === 3) {
    return {
      emoji: "🥉",
      title: "Tebrikler",
      subtitle: "Soru ekleme sıralamasında 3. sıradasın.",
      value: "3.",
    };
  }

  return null;
}

export default function LeaderboardCelebrationModal({
  open,
  rank,
  onClose,
}: LeaderboardCelebrationModalProps) {
  const meta = getRankMeta(rank);

  if (!open || !meta) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6 sm:flex sm:items-center sm:justify-center">
      <div className="flex min-h-full items-center justify-center sm:min-h-0">
        <div className="relative my-auto w-full max-w-lg overflow-hidden rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_82%,white))] p-6 shadow-[0_24px_90px_rgba(15,23,42,0.28)] sm:p-7">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confettiItems.map((item, index) => (
              <span
                key={`${item.left}-${index}`}
                className="absolute top-[-10%] h-5 w-2 rounded-full opacity-90"
                style={{
                  left: item.left,
                  backgroundColor: item.color,
                  animation: `leaderboard-confetti ${item.duration} linear ${item.delay} infinite`,
                  transform: `rotate(${item.rotate})`,
                }}
              />
            ))}
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_70%)]" />
          </div>

          <div className="relative text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-3xl shadow-[var(--shadow-soft)]">
              {meta.emoji}
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[var(--primary)]">
              Başarı Rozeti
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
              {meta.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
              {meta.subtitle}
            </p>

            <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,white)] px-6 py-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                Sıralaman
              </p>
              <p className="mt-2 text-6xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">
                {meta.value}
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-2xl bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
