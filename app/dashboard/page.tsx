"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import AppNavbar from "@/components/ui/AppNavbar";
import { type AnnouncementRow } from "@/lib/announcements";
import { getUser, getUserProfile, signOut, syncUserProfileEmail } from "@/lib/auth";
import { authorizedFetch } from "@/lib/clientApi";
import { classGroup, classRoster, lessonSlots } from "@/lib/courseData";

type SectionKey = "roster" | "schedule";

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

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await getUserProfile(data.user.id);
      if (profile) {
        if (profile.is_active === false) {
          await signOut();
          router.push("/auth/login");
          return;
        }

        if (data.user.email) {
          void syncUserProfileEmail(data.user.id, data.user.email);
        }

        setName(profile.name || data.user.user_metadata?.name || data.user.email || "Arkada?");
      } else {
        setName(data.user.user_metadata?.name || data.user.email || "Arkada?");
      }

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

    void loadAnnouncements();
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

  const firstName = useMemo(() => {
    const trimmed = name?.trim() ?? "";
    return trimmed.split(" ").filter(Boolean)[0] ?? "Arkada?";
  }, [name]);

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
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{announcements.length > 0 ? "Son duyurular" : "Şimdilik sessiz"}</h2>
              <div className="mt-4 space-y-3">
                {announcements.length > 0 ? announcements.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground-muted)]">{item.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">
                        {new Date(item.created_at).toLocaleString("tr-TR")}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] px-4 py-4 text-sm leading-7 text-[var(--foreground-muted)]">
                    Buraya ders değişikliği, sınav bilgisi, son dakika notu gibi şeyleri ekleyeceğiz.
                  </div>
                )}
              </div>
            </article>
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
                    {classRoster.map((student, index) => (
                      <div
                        key={student.name}
                        className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] px-3 py-2.5"
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[11px] font-semibold text-[var(--foreground-muted)]">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[var(--foreground)]">{student.name}</p>
                          {student.note ? (
                            <p className="truncate text-[11px] font-semibold text-[var(--primary)]">{student.note}</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
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
                  <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">Slot Tablosu</h2>
                </div>
                <span className="text-xl text-[var(--foreground-muted)]">
                  {openSection === "schedule" ? "−" : "+"}
                </span>
              </button>

              {openSection === "schedule" && (
                <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))] px-4 py-6 text-sm text-[var(--foreground-muted)]">
                    Slot tablosunun içini şimdilik boş bıraktık. Sonraki turda programı daha temiz bir görünümle
                    dolduracağız.
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
