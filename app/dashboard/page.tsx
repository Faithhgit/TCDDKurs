"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import AdsenseBanner from "@/components/ui/AdsenseBanner";
import LeaderboardCelebrationModal, {
  type LeaderboardCelebrationItem,
} from "@/components/ui/LeaderboardCelebrationModal";
import LeaderboardBadge from "@/components/ui/LeaderboardBadge";
import AppNavbar from "@/components/ui/AppNavbar";
import { type AnnouncementRow } from "@/lib/announcements";
import { getUser, getUserProfile, signOut, syncUserProfileEmail } from "@/lib/auth";
import { authorizedFetch } from "@/lib/clientApi";
import { classGroup, classRoster, lessonSlots } from "@/lib/courseData";
import { type LeaderboardCategory, type LeaderboardEntry, type RankedLeaderboardEntry, normalizePersonName } from "@/lib/leaderboard";

type SectionKey = "roster" | "schedule";
type DashboardLeaderboardPayload = {
  items?: LeaderboardEntry[];
  categories?: {
    approved?: LeaderboardEntry[];
    solved?: RankedLeaderboardEntry[];
    correct?: RankedLeaderboardEntry[];
    quiz?: RankedLeaderboardEntry[];
  };
};

type DashboardLeaderboardCategories = {
  approved: LeaderboardEntry[];
  solved: RankedLeaderboardEntry[];
  correct: RankedLeaderboardEntry[];
  quiz: RankedLeaderboardEntry[];
};

function parseScheduleDate(value: string) {
  const [day, month, year] = value.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function slotDateTime(date: string, time: string) {
  const parsedDate = parseScheduleDate(date);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate(),
    hours,
    minutes
  );
}

function startOfWeek(date: Date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
  return normalized;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatScheduleDate(date: Date) {
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [leaderboardCategories, setLeaderboardCategories] = useState<DashboardLeaderboardCategories>({
    approved: [],
    solved: [],
    correct: [],
    quiz: [],
  });
  const [canAccessMakinistGuide, setCanAccessMakinistGuide] = useState(false);
  const [makinistGuideMessage, setMakinistGuideMessage] = useState(
    "Bu modül şu an hesabınıza açık değil. Erişim tanımlanması için yöneticinizle iletişime geçin."
  );
  const [celebrationItems, setCelebrationItems] = useState<LeaderboardCelebrationItem[]>([]);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const lastCelebrationSignatureRef = useRef("");

  useEffect(() => {
    async function load() {
      const { data } = await getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await getUserProfile(data.user.id);
      setUserId(data.user.id);
      if (profile) {
        if (profile.is_active === false) {
          await signOut();
          router.push("/auth/login");
          return;
        }

        if (data.user.email) {
          void syncUserProfileEmail(data.user.id, data.user.email);
        }

        setName(profile.name || data.user.user_metadata?.name || data.user.email || "Arkadaş");
      } else {
        setName(data.user.user_metadata?.name || data.user.email || "Arkadaş");
      }

      setCanAccessMakinistGuide(profile?.can_access_makinist_guide === true);
      setMakinistGuideMessage(
        profile?.makinist_guide_message?.trim() ||
          "Bu modül şu an hesabınıza açık değil. Erişim tanımlanması için yöneticinizle iletişime geçin."
      );
      setLoading(false);
    }

    void load();
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadAnnouncements() {
      const response = await authorizedFetch("/api/announcements", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const payload = (await response.json().catch(() => null)) as { items?: AnnouncementRow[] } | null;
      setAnnouncements(payload?.items ?? []);
    }

    async function loadLeaderboard() {
      const response = await authorizedFetch("/api/leaderboard", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const payload = (await response.json().catch(() => null)) as DashboardLeaderboardPayload | null;
      setLeaderboardCategories({
        approved: payload?.categories?.approved ?? payload?.items ?? [],
        solved: payload?.categories?.solved ?? [],
        correct: payload?.categories?.correct ?? [],
        quiz: payload?.categories?.quiz ?? [],
      });
    }

    void loadAnnouncements();
    void loadLeaderboard();
  }, []);

  const lessonStatus = useMemo(() => {
    const currentSlot =
      lessonSlots.find((slot) => {
        const dayMatches = sameDay(parseScheduleDate(slot.date), now);
        if (!dayMatches) return false;

        const start = parseTimeToMinutes(slot.start);
        const end = parseTimeToMinutes(slot.end);
        const minutesNow = now.getHours() * 60 + now.getMinutes();

        return minutesNow >= start && minutesNow < end;
      }) ?? null;

    const nextSlot =
      lessonSlots.find((slot) => slotDateTime(slot.date, slot.start).getTime() > now.getTime()) ?? null;

    return { currentSlot, nextSlot };
  }, [now]);

  const weeklySchedule = useMemo(() => {
    const weekStart = startOfWeek(now);

    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const slotsForDay = lessonSlots.filter((slot) => sameDay(parseScheduleDate(slot.date), date));
      const firstSlot = slotsForDay[0] ?? null;
      const lastSlot = slotsForDay.at(-1) ?? null;

      return {
        dayLabel: date.toLocaleDateString("tr-TR", { weekday: "long" }),
        dateLabel: formatScheduleDate(date),
        lesson: firstSlot?.lesson ?? null,
        instructor: firstSlot?.instructor ?? null,
        timeRange: firstSlot && lastSlot ? `${firstSlot.start} - ${lastSlot.end}` : null,
      };
    });
  }, [now]);

  const firstName = useMemo(() => {
    const trimmed = name?.trim() ?? "";
    return trimmed.split(" ").filter(Boolean)[0] ?? "Arkadaş";
  }, [name]);

  const rosterBadgeMap = useMemo(() => {
    const map = new Map<string, LeaderboardCelebrationItem[]>();
    const categoryEntries: Array<[LeaderboardCategory, Array<LeaderboardEntry | RankedLeaderboardEntry>]> = [
      ["approved", leaderboardCategories.approved ?? []],
      ["solved", leaderboardCategories.solved ?? []],
      ["correct", leaderboardCategories.correct ?? []],
      ["quiz", leaderboardCategories.quiz ?? []],
    ];

    categoryEntries.forEach(([category, entries]) => {
      entries.slice(0, 3).forEach((item) => {
        if (!item.badge || item.rank > 3) return;
        const key = normalizePersonName(item.name);
        const current = map.get(key) ?? [];
        current.push({
          category,
          badge: item.badge,
          rank: item.rank as 1 | 2 | 3,
        });
        map.set(key, current);
      });
    });

    return map;
  }, [leaderboardCategories]);

  const currentCelebrationItems = useMemo(() => {
    if (!userId) return [];

    const items: LeaderboardCelebrationItem[] = [];
    const categoryEntries: Array<[LeaderboardCategory, Array<LeaderboardEntry | RankedLeaderboardEntry>]> = [
      ["approved", leaderboardCategories.approved ?? []],
      ["solved", leaderboardCategories.solved ?? []],
      ["correct", leaderboardCategories.correct ?? []],
      ["quiz", leaderboardCategories.quiz ?? []],
    ];

    categoryEntries.forEach(([category, entries]) => {
      const found = entries.find((item) => item.userId === userId);
      if (!found?.badge || found.rank > 3) return;
      items.push({
        category,
        badge: found.badge,
        rank: found.rank as 1 | 2 | 3,
      });
    });

    return items;
  }, [leaderboardCategories, userId]);

  useEffect(() => {
    if (currentCelebrationItems.length === 0 || !userId) return;

    const storageKey = `leaderboard-earned-badges:${userId}`;
    const sessionKey = `leaderboard-login-celebration:${userId}`;
    const currentKeys = currentCelebrationItems
      .map((item) => `${item.category}-${item.rank}`)
      .sort();
    const currentSignature = currentKeys.join("|");
    const previousKeys = (() => {
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as string[]) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    const previousSet = new Set(previousKeys);
    const newlyEarned = currentCelebrationItems.filter((item) => !previousSet.has(`${item.category}-${item.rank}`));
    const shouldShowOnLogin = sessionStorage.getItem(sessionKey) !== "shown";

    localStorage.setItem(storageKey, JSON.stringify(currentKeys));

    if (shouldShowOnLogin) {
      sessionStorage.setItem(sessionKey, "shown");
      lastCelebrationSignatureRef.current = currentSignature;
      const timer = window.setTimeout(() => {
        setCelebrationItems(currentCelebrationItems);
        setCelebrationOpen(true);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    if (newlyEarned.length === 0 || lastCelebrationSignatureRef.current === currentSignature) {
      return;
    }

    lastCelebrationSignatureRef.current = currentSignature;
    const timer = window.setTimeout(() => {
      setCelebrationItems(newlyEarned);
      setCelebrationOpen(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [currentCelebrationItems, userId]);

  function toggleSection(section: SectionKey) {
    setOpenSection((current) => (current === section ? null : section));
  }

  if (loading) {
    return (
      <AppLoadingScreen
        eyebrow="Ana Sayfa"
        title="Ekran açılıyor"
        description="Kutular yerleşiyor, birazdan hazırsın."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <LeaderboardCelebrationModal
        open={celebrationOpen}
        items={celebrationItems}
        onClose={() => {
          setCelebrationOpen(false);
          setCelebrationItems([]);
        }}
      />
      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface)_97%,white),color-mix(in_srgb,var(--surface-muted)_86%,white))] p-5 shadow-[var(--shadow-strong)] sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_55%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Çözüm Modları</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
                Hoş geldin, {firstName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
                Bugün hangi modda çalışmak istersin?
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Link
                  href="/dashboard/solve?mode=classic"
                  className="group relative flex min-h-36 flex-col justify-center overflow-hidden rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_92%,white),var(--surface-muted))] p-4 text-center shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                >
                  <div className="relative flex flex-col items-center">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">Klasik Mod</p>
                    <h3 className="mt-2 text-base font-semibold text-[var(--foreground)] sm:text-lg">Soru Çöz</h3>
                    <p className="mt-2 max-w-[24ch] text-sm leading-6 text-[var(--foreground-muted)]">
                      Bildiğimiz düz soru çöz akışı burada duracak.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/solve?mode=true-false"
                  className="group relative flex min-h-36 flex-col justify-center overflow-hidden rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_92%,white),var(--surface-muted))] p-4 text-center shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                >
                  <div className="relative flex flex-col items-center">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">Hızlı Mod</p>
                    <h3 className="mt-2 text-base font-semibold text-[var(--foreground)] sm:text-lg">
                      Doğru / Yanlış
                    </h3>
                    <p className="mt-2 max-w-[24ch] text-sm leading-6 text-[var(--foreground-muted)]">
                      Hızlı karar verip ilerlenen test yapısı burada olacak.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/solve?mode=quiz"
                  className="group relative flex min-h-36 flex-col justify-center overflow-hidden rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_92%,white),var(--surface-muted))] p-4 text-center shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                >
                  <div className="relative flex flex-col items-center">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">Quiz Modu</p>
                    <h3 className="mt-2 text-base font-semibold text-[var(--foreground)] sm:text-lg">
                      40 Soru / 40 Dakika
                    </h3>
                    <p className="mt-2 max-w-[24ch] text-sm leading-6 text-[var(--foreground-muted)]">
                      Süreli tam deneme ekranı burada olacak.
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Ek Modül</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Lokomotif Bilgi Rehberi</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
                  Lokomotif serileri, jeneratör vagonları ve kaza / olay içerikleri bu modülde toplandı.
                </p>
              </div>

              <Link
                href="/dashboard/makinist-v01"
                className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
              >
                Modülü Aç
              </Link>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Ders Durumu</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Bugün ve Sonrası</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                    Şu Anki Ders
                  </p>
                  {lessonStatus.currentSlot ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                        {lessonStatus.currentSlot.lesson}
                      </p>
                      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                        {lessonStatus.currentSlot.start} - {lessonStatus.currentSlot.end}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">Şu an aktif ders görünmüyor.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                    Bir Sonraki Ders
                  </p>
                  {lessonStatus.nextSlot ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                        {lessonStatus.nextSlot.lesson}
                      </p>
                      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                        {lessonStatus.nextSlot.date} · {lessonStatus.nextSlot.start} - {lessonStatus.nextSlot.end}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">Sıradaki ders henüz görünmüyor.</p>
                  )}
                </div>
              </div>
            </article>

            <article className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Duyurular</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                {announcements.length > 0 ? "Son duyurular" : "Şimdilik sessiz"}
              </h2>
              <div className="mt-4 space-y-3">
                {announcements.length > 0 ? (
                  announcements.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground-muted)]">
                            {item.description}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">
                          {new Date(item.created_at).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] px-4 py-4 text-sm leading-7 text-[var(--foreground-muted)]">
                    Buraya ders değişikliği, sınav bilgisi, son dakika notu gibi şeyleri ekleyeceğiz.
                  </div>
                )}
              </div>
            </article>
          </section>

          <AdsenseBanner />

          <section hidden className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Ek Modül</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Lokomotif Bilgi Rehberi</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
                  {canAccessMakinistGuide
                    ? "Lokomotif serileri, jeneratör vagonları ve kaza / olay içerikleri bu modülde toplandı."
                    : makinistGuideMessage}
                </p>
              </div>

              {canAccessMakinistGuide ? (
                <Link
                  href="/dashboard/makinist-v01"
                  className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
                >
                  Modülü Aç
                </Link>
              ) : (
                <span className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)]">
                  Erişim Kapalı
                </span>
              )}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <article className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] shadow-[var(--shadow-soft)]">
              <button
                type="button"
                onClick={() => toggleSection("roster")}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Sınıf Listesi</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                    {classGroup.title} ({classGroup.code})
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                    {classRoster.length} kişi
                  </span>
                  <span className="text-xl text-[var(--foreground-muted)]">{openSection === "roster" ? "−" : "+"}</span>
                </div>
              </button>

              {openSection === "roster" && (
                <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {classRoster.map((student, index) => {
                      const badges = rosterBadgeMap.get(normalizePersonName(student.name)) ?? [];

                      return (
                        <div
                          key={student.name}
                          className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] px-3 py-2.5"
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[10px] font-semibold text-[var(--foreground-muted)]">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-medium text-[var(--foreground)]">{student.name}</p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              {student.note ? (
                                <p className="truncate text-[11px] font-semibold text-[var(--primary)]">{student.note}</p>
                              ) : (
                                <span />
                              )}
                              {badges.length > 0 ? (
                                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                                  {badges.map((item) => (
                                    <LeaderboardBadge
                                      key={`${student.name}-${item.category}-${item.rank}`}
                                      badge={item.badge}
                                      category={item.category}
                                      label={`${item.rank}. sıra · ${
                                        item.category === "approved"
                                          ? "Onaylı soru"
                                          : item.category === "solved"
                                            ? "Çözülen soru"
                                            : item.category === "correct"
                                              ? "Doğru sayısı"
                                              : "Quiz"
                                      }`}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>

            <article className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] shadow-[var(--shadow-soft)]">
              <button
                type="button"
                onClick={() => toggleSection("schedule")}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Ders Programı</p>
                  <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">Haftalık Görünüm</h2>
                </div>
                <span className="text-xl text-[var(--foreground-muted)]">
                  {openSection === "schedule" ? "−" : "+"}
                </span>
              </button>

              {openSection === "schedule" && (
                <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
                  <div className="space-y-2.5">
                    {weeklySchedule.map((entry) => (
                      <div
                        key={`schedule-${entry.dateLabel}-${entry.dayLabel}`}
                        className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[12px] font-semibold capitalize text-[var(--foreground)]">{entry.dayLabel}</p>
                          <p className="shrink-0 text-[12px] text-[var(--foreground-muted)]">{entry.dateLabel}</p>
                        </div>
                        {entry.lesson ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-[13px] font-medium leading-5 text-[var(--foreground)]">{entry.lesson}</p>
                            <p className="text-[12px] leading-5 text-[var(--foreground-muted)]">
                              {entry.timeRange} · {entry.instructor}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-[12px] leading-5 text-[var(--foreground-muted)]">Bu gün için ders görünmüyor.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
