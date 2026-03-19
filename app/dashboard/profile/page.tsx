"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import AppNavbar from "@/components/ui/AppNavbar";
import LeaderboardBadge from "@/components/ui/LeaderboardBadge";
import { getUser, getUserProfile, signOut, syncUserProfileEmail } from "@/lib/auth";
import { authorizedFetch } from "@/lib/clientApi";
import { type LeaderboardEntry, type RankedLeaderboardEntry } from "@/lib/leaderboard";

type QuestionStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type SolveStats = {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  modeStats: {
    classic: { total: number; correct: number; wrong: number; skipped: number };
    true_false: { total: number; correct: number; wrong: number; skipped: number };
    quiz: { total: number; correct: number; wrong: number; skipped: number };
  };
};

type QuizHistoryItem = {
  id: number;
  topic_id: number | null;
  topicTitle: string | null;
  total_questions: number;
  answered_count: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  duration_seconds: number;
  elapsed_seconds: number | null;
  status: string;
  ended_reason: string | null;
  started_at: string;
  finished_at: string | null;
};

type ProfileStatsPayload = {
  contribution: QuestionStats;
  solving: SolveStats;
  quizHistory: QuizHistoryItem[];
};

type ProfileTab = "stats" | "quiz";
type LeaderboardTab = "approved" | "solved" | "correct" | "quiz";

type LeaderboardPayload = {
  items?: LeaderboardEntry[];
  categories?: {
    approved?: LeaderboardEntry[];
    solved?: RankedLeaderboardEntry[];
    correct?: RankedLeaderboardEntry[];
    quiz?: RankedLeaderboardEntry[];
  };
};

function quizEndedReasonLabel(value: string | null) {
  if (value === "time_up") return "Süre doldu";
  if (value === "cancelled") return "İptal edildi";
  return "Kullanıcı bitirdi";
}

function leaderboardMeta(tab: LeaderboardTab) {
  switch (tab) {
    case "approved":
      return {
        title: "Onaylı Soru Liderliği",
        badgeLabel: (rank: number) => `Onaylı soru liderliğinde ${rank}.`,
        valueLabel: "onaylı soru",
        secondaryLabel: (entry: LeaderboardEntry) => `${entry.totalCount} toplam soru`,
      };
    case "solved":
      return {
        title: "Çözülen Soru Liderliği",
        badgeLabel: (rank: number) => `Benzersiz çözülen soru liderliğinde ${rank}.`,
        valueLabel: "benzersiz çözüm",
        secondaryLabel: (entry: RankedLeaderboardEntry) => `${entry.secondaryValue} benzersiz doğru`,
      };
    case "correct":
      return {
        title: "Doğru Sayısı Liderliği",
        badgeLabel: (rank: number) => `Benzersiz doğru liderliğinde ${rank}.`,
        valueLabel: "benzersiz doğru",
        secondaryLabel: (entry: RankedLeaderboardEntry) => `${entry.secondaryValue} benzersiz çözüm`,
      };
    case "quiz":
      return {
        title: "Quiz Performansı",
        badgeLabel: (rank: number) => `Quiz doğruları liderliğinde ${rank}.`,
        valueLabel: "quiz doğru",
        secondaryLabel: (entry: RankedLeaderboardEntry) => `${entry.secondaryValue} cevaplanan soru`,
      };
  }
}

function getLeaderboardEntryValue(tab: LeaderboardTab, entry: LeaderboardEntry | RankedLeaderboardEntry) {
  if (tab === "approved" && "approvedCount" in entry) {
    return entry.approvedCount;
  }

  return "value" in entry ? entry.value : 0;
}

function getLeaderboardEntrySecondary(tab: LeaderboardTab, entry: LeaderboardEntry | RankedLeaderboardEntry) {
  if (tab === "approved" && "totalCount" in entry) {
    return `${entry.totalCount} toplam soru`;
  }

  if ("secondaryValue" in entry) {
    if (tab === "solved") return `${entry.secondaryValue} benzersiz doğru`;
    if (tab === "correct") return `${entry.secondaryValue} benzersiz çözüm`;
    if (tab === "quiz") return `${entry.secondaryValue} cevaplanan soru`;
  }

  return "";
}

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [stats, setStats] = useState<QuestionStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [solveStats, setSolveStats] = useState<SolveStats>({
    total: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    accuracy: 0,
    modeStats: {
      classic: { total: 0, correct: 0, wrong: 0, skipped: 0 },
      true_false: { total: 0, correct: 0, wrong: 0, skipped: 0 },
      quiz: { total: 0, correct: 0, wrong: 0, skipped: 0 },
    },
  });
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [approvedLeaderboard, setApprovedLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rankedLeaderboards, setRankedLeaderboards] = useState<{
    solved: RankedLeaderboardEntry[];
    correct: RankedLeaderboardEntry[];
    quiz: RankedLeaderboardEntry[];
  }>({
    solved: [],
    correct: [],
    quiz: [],
  });
  const [activeTab, setActiveTab] = useState<ProfileTab>("stats");
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>("approved");
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data } = await getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      const profile = await getUserProfile(data.user.id);
      if (profile.data?.is_active === false) {
        await signOut();
        router.push("/auth/login");
        return;
      }

      if (data.user.email) {
        void syncUserProfileEmail(data.user.id, data.user.email);
      }

      const [statsResponse, leaderboardResponse] = await Promise.all([
        authorizedFetch("/api/profile/stats", {
          method: "GET",
          cache: "no-store",
        }),
        authorizedFetch("/api/leaderboard", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const statsPayload = statsResponse.ok
        ? ((await statsResponse.json().catch(() => null)) as ProfileStatsPayload | null)
        : null;

      const leaderboardPayload = leaderboardResponse.ok
        ? ((await leaderboardResponse.json().catch(() => null)) as LeaderboardPayload | null)
        : null;

      setUserId(data.user.id);
      setName(profile.data?.name || data.user.user_metadata?.name || "Kullanıcı");
      setRole(profile.data?.role || "student");
      setUserEmail(data.user.email || "");
      setStats(statsPayload?.contribution ?? { total: 0, pending: 0, approved: 0, rejected: 0 });
      setSolveStats(
        statsPayload?.solving ?? {
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          accuracy: 0,
          modeStats: {
            classic: { total: 0, correct: 0, wrong: 0, skipped: 0 },
            true_false: { total: 0, correct: 0, wrong: 0, skipped: 0 },
            quiz: { total: 0, correct: 0, wrong: 0, skipped: 0 },
          },
        }
      );
      setQuizHistory(statsPayload?.quizHistory ?? []);
      setApprovedLeaderboard(leaderboardPayload?.categories?.approved ?? leaderboardPayload?.items ?? []);
      setRankedLeaderboards({
        solved: leaderboardPayload?.categories?.solved ?? [],
        correct: leaderboardPayload?.categories?.correct ?? [],
        quiz: leaderboardPayload?.categories?.quiz ?? [],
      });
      setLoading(false);
    }

    void loadUser();
  }, [router]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const contributionRank = useMemo(
    () => approvedLeaderboard.find((item) => item.userId === userId) ?? null,
    [approvedLeaderboard, userId]
  );

  const activeLeaderboard = useMemo(() => {
    if (leaderboardTab === "approved") return approvedLeaderboard;
    return rankedLeaderboards[leaderboardTab];
  }, [approvedLeaderboard, leaderboardTab, rankedLeaderboards]);

  const activeLeaderboardMeta = useMemo(() => leaderboardMeta(leaderboardTab), [leaderboardTab]);

  const activeLeaderboardRank = useMemo(() => {
    return activeLeaderboard.find((item) => item.userId === userId) ?? null;
  }, [activeLeaderboard, userId]);

  if (loading) {
    return (
      <AppLoadingScreen
        eyebrow="Profil"
        title="Profil hazırlanıyor"
        description="Kısa bir toparlanma, sonra her şey önünde."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Profil</p>
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">Senin Alanın</h1>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Çıkış
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">İsim</p>
                <p className="mt-2 font-medium text-[var(--foreground)]">{name}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">E-posta</p>
                <p className="mt-2 break-all font-medium text-[var(--foreground)]">{userEmail}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Rol</p>
                <p className="mt-2 font-medium capitalize text-[var(--foreground)]">
                  {role === "manager" ? "Yönetici" : role === "admin" ? "Admin" : "Öğrenci"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Katkı Özeti</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  Şu ana kadar toplam {stats.total} soru eklemişsin
                </h2>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-xs text-[var(--foreground-muted)]">Sıra</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-semibold text-[var(--foreground)]">
                    {contributionRank?.rank ?? "-"}
                  </span>
                  <LeaderboardBadge badge={contributionRank?.badge ?? null} category="approved" />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex min-h-24 flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-[11px] font-medium text-[var(--foreground-muted)] sm:text-xs sm:uppercase sm:tracking-[0.16em]">
                  Toplam
                </p>
                <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{stats.total}</p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                <p className="text-[11px] font-medium text-amber-800 sm:text-xs sm:uppercase sm:tracking-[0.16em] dark:text-amber-200">
                  Bekleyen
                </p>
                <p className="mt-3 text-2xl font-semibold text-amber-900 dark:text-amber-100">{stats.pending}</p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                <p className="text-[11px] font-medium text-emerald-800 sm:text-xs sm:uppercase sm:tracking-[0.16em] dark:text-emerald-200">
                  Onaylanan
                </p>
                <p className="mt-3 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
                  {stats.approved}
                </p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
                <p className="text-[11px] font-medium text-rose-800 sm:text-xs sm:uppercase sm:tracking-[0.16em] dark:text-rose-200">
                  Reddedilen
                </p>
                <p className="mt-3 text-2xl font-semibold text-rose-900 dark:text-rose-100">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                  activeTab === "stats"
                    ? "bg-[var(--foreground)] text-[var(--surface)]"
                    : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                }`}
              >
                Çözüm İstatistikleri
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("quiz")}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                  activeTab === "quiz"
                    ? "bg-[var(--foreground)] text-[var(--surface)]"
                    : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                }`}
              >
                Quiz Denemeleri
              </button>
            </div>

            {activeTab === "stats" ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Çözüm Özeti</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    Şu ana kadar {solveStats.total} çözüm kaydı oluştu
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs text-[var(--foreground-muted)]">Toplam</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{solveStats.total}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                    <p className="text-xs text-emerald-800 dark:text-emerald-200">Doğru</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
                      {solveStats.correct}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
                    <p className="text-xs text-rose-800 dark:text-rose-200">Yanlış</p>
                    <p className="mt-2 text-2xl font-semibold text-rose-900 dark:text-rose-100">
                      {solveStats.wrong}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                    <p className="text-xs text-amber-800 dark:text-amber-200">Boş</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-900 dark:text-amber-100">
                      {solveStats.skipped}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs text-[var(--foreground-muted)]">Başarı</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">%{solveStats.accuracy}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--primary)]">Klasik</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      {solveStats.modeStats.classic.total} çözüm · {solveStats.modeStats.classic.correct} doğru
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--primary)]">Doğru / Yanlış</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      {solveStats.modeStats.true_false.total} çözüm · {solveStats.modeStats.true_false.correct} doğru
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--primary)]">Quiz</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      {solveStats.modeStats.quiz.total} çözüm · {solveStats.modeStats.quiz.correct} doğru
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Quiz Geçmişi</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Son quiz denemelerin</h2>
                </div>

                {quizHistory.length > 0 ? (
                  quizHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {item.topicTitle || "Tüm konular"} · {item.total_questions} soru
                          </p>
                          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                            {new Date(item.started_at).toLocaleString("tr-TR")} ·{" "}
                            {quizEndedReasonLabel(item.ended_reason)}
                          </p>
                        </div>
                        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <p className="text-[11px] text-[var(--foreground-muted)]">Doğru</p>
                          <p className="mt-1 font-semibold text-[var(--foreground)]">{item.correct_count}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <p className="text-[11px] text-[var(--foreground-muted)]">Yanlış</p>
                          <p className="mt-1 font-semibold text-[var(--foreground)]">{item.wrong_count}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <p className="text-[11px] text-[var(--foreground-muted)]">Boş</p>
                          <p className="mt-1 font-semibold text-[var(--foreground)]">{item.skipped_count}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <p className="text-[11px] text-[var(--foreground-muted)]">Cevaplanan</p>
                          <p className="mt-1 font-semibold text-[var(--foreground)]">{item.answered_count}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <p className="text-[11px] text-[var(--foreground-muted)]">Süre</p>
                          <p className="mt-1 font-semibold text-[var(--foreground)]">{item.elapsed_seconds ?? 0} sn</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
                    Henüz quiz geçmişi görünmüyor.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
            <button
              type="button"
              onClick={() => setLeaderboardOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Liderlik</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  Sınıf sıralaması ve çözüm liderliği
                </h2>
              </div>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                {leaderboardOpen ? "Kapat" : "Aç"}
              </span>
            </button>

            {leaderboardOpen ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLeaderboardTab("approved")}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                      leaderboardTab === "approved"
                        ? "bg-[var(--foreground)] text-[var(--surface)]"
                        : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                    }`}
                  >
                    Onaylı Sorular
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardTab("solved")}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                      leaderboardTab === "solved"
                        ? "bg-[var(--foreground)] text-[var(--surface)]"
                        : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                    }`}
                  >
                    Çözülen Soru
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardTab("correct")}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                      leaderboardTab === "correct"
                        ? "bg-[var(--foreground)] text-[var(--surface)]"
                        : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                    }`}
                  >
                    Doğru Sayısı
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardTab("quiz")}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                      leaderboardTab === "quiz"
                        ? "bg-[var(--foreground)] text-[var(--surface)]"
                        : "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]"
                    }`}
                  >
                    Quiz
                  </button>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <p className="text-sm text-[var(--foreground-muted)]">{activeLeaderboardMeta.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-3xl font-semibold text-[var(--foreground)]">
                      {activeLeaderboardRank?.rank ?? "-"}
                    </span>
                    <span className="text-sm text-[var(--foreground-muted)]">
                      {activeLeaderboardRank
                        ? `${getLeaderboardEntryValue(leaderboardTab, activeLeaderboardRank)} ${activeLeaderboardMeta.valueLabel} · ${getLeaderboardEntrySecondary(leaderboardTab, activeLeaderboardRank)}`
                        : "Henüz bu sıralamada görünmüyorsun."}
                    </span>
                    <LeaderboardBadge
                      badge={activeLeaderboardRank?.badge ?? null}
                      category={leaderboardTab}
                      label={activeLeaderboardRank ? activeLeaderboardMeta.badgeLabel(activeLeaderboardRank.rank) : undefined}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {activeLeaderboard.map((item) => (
                    <div
                      key={`${leaderboardTab}-${item.userId}`}
                      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                        item.userId === userId
                          ? "border-[color:color-mix(in_srgb,var(--primary)_34%,var(--border))] bg-[color:color-mix(in_srgb,var(--surface-muted)_92%,white)]"
                          : "border-[var(--border)] bg-[var(--surface-muted)]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--foreground)]">{item.rank}.</span>
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.name}</p>
                          <LeaderboardBadge
                            badge={item.badge}
                            category={leaderboardTab}
                            label={activeLeaderboardMeta.badgeLabel(item.rank)}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {getLeaderboardEntryValue(leaderboardTab, item)}
                        </p>
                        <p className="text-[11px] text-[var(--foreground-muted)]">
                          {activeLeaderboardMeta.valueLabel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
