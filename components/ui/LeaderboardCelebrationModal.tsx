"use client";

import LeaderboardMedal from "@/components/ui/LeaderboardMedal";
import { type LeaderboardCategory } from "@/lib/leaderboard";

export type LeaderboardCelebrationItem = {
  category: LeaderboardCategory;
  badge: "gold" | "silver" | "bronze";
  rank: 1 | 2 | 3;
};

type LeaderboardCelebrationModalProps = {
  open: boolean;
  items: LeaderboardCelebrationItem[];
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

function categoryLabel(category: LeaderboardCategory) {
  if (category === "approved") return "Onaylı soru";
  if (category === "solved") return "Çözülen soru";
  if (category === "correct") return "Doğru sayısı";
  return "Quiz";
}

export default function LeaderboardCelebrationModal({
  open,
  items,
  onClose,
}: LeaderboardCelebrationModalProps) {
  if (!open || items.length === 0) {
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
            <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-3 rounded-[26px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-soft)]">
              {items.map((item) => (
                <LeaderboardMedal
                  key={`${item.category}-${item.rank}`}
                  badge={item.badge}
                  category={item.category}
                  size="lg"
                />
              ))}
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Başarı Rozetleri</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
              Tebrikler
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
              Sıralamalarda öne çıktığın rozetler burada görünüyor.
            </p>

            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.category}-${item.rank}-row`}
                  className="flex items-center justify-between rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,white)] px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <LeaderboardMedal badge={item.badge} category={item.category} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{categoryLabel(item.category)}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{item.rank}. sıradasın</p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-[var(--foreground)]">#{item.rank}</span>
                </div>
              ))}
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
