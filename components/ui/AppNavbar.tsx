"use client";

import Link from "next/link";
import type { MouseEvent as ReactMouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import BugReportModal from "@/components/ui/BugReportModal";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { lessonSlots, lessonTimeline } from "@/lib/courseData";
import { supabase } from "@/lib/supabaseClient";

const routes = [
  { href: "/dashboard", label: "Ana Sayfa" },
  { href: "/dashboard/solve", label: "Soru Çöz" },
  { href: "/dashboard/add-question", label: "Soru Ekle" },
];

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

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

function getCourseStatus(date: Date) {
  const todaySlots = lessonSlots.filter((slot) => sameDay(parseScheduleDate(slot.date), date));
  if (!todaySlots.length) {
    return {
      label: "Ders Dışı",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300",
    };
  }

  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const activeLesson = todaySlots.find((slot) => {
    const start = parseTimeToMinutes(slot.start);
    const end = parseTimeToMinutes(slot.end);
    return nowMinutes >= start && nowMinutes < end;
  });

  if (activeLesson) {
    return {
      label: "Derste",
      dotClass: "bg-rose-500",
      textClass: "text-rose-700 dark:text-rose-300",
    };
  }

  const activeBreak = lessonTimeline.find((slot) => {
    if (slot.type === "lesson") return false;
    const start = parseTimeToMinutes(slot.start);
    const end = parseTimeToMinutes(slot.end);
    return nowMinutes >= start && nowMinutes < end;
  });

  if (activeBreak) {
    return {
      label: "Molada",
      dotClass: "bg-amber-500",
      textClass: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    label: "Ders Dışı",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700 dark:text-emerald-300",
  };
}

type AppNavbarProps = {
  onNavigateAttempt?: (href: string) => boolean;
};

export default function AppNavbar({ onNavigateAttempt }: AppNavbarProps) {
  const path = usePathname();
  const [role, setRole] = useState<"student" | "admin" | "manager">("student");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadRole() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("role, is_active")
        .eq("id", userData.user.id)
        .single();

      if (profile?.is_active === false) {
        await supabase.auth.signOut();
        window.location.href = "/auth/login";
        return;
      }

      setRole((profile?.role as "student" | "admin" | "manager") ?? "student");
    }

    void loadRole();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const courseStatus = useMemo(() => getCourseStatus(now), [now]);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  function handleProtectedNavigation(event: ReactMouseEvent<HTMLElement>, href: string) {
    if (!onNavigateAttempt) return;
    const shouldContinue = onNavigateAttempt(href);
    if (!shouldContinue) {
      event.preventDefault();
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[color:color-mix(in_srgb,var(--border)_90%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] backdrop-blur-2xl">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {routes.map((route) => {
              const isActive = path === route.href;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={(event) => handleProtectedNavigation(event, route.href)}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold sm:text-sm ${
                    isActive
                      ? "border border-[color:color-mix(in_srgb,var(--primary)_78%,black)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-soft)]"
                      : "border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] text-[var(--foreground)]"
                  }`}
                >
                  {route.label}
                </Link>
              );
            })}
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] px-3 py-2 text-xs font-medium shadow-[var(--shadow-soft)] sm:inline-flex">
                <span className={`h-2.5 w-2.5 rounded-full ${courseStatus.dotClass}`} />
                <span className={courseStatus.textClass}>{courseStatus.label}</span>
              </div>

              <div className="hidden rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] px-3 py-2 text-xs font-medium text-[var(--foreground-muted)] shadow-[var(--shadow-soft)] sm:block">
                {formatClock(now)}
              </div>

              <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] text-lg font-semibold text-[var(--foreground)] shadow-[var(--shadow-soft)]"
                aria-label="Ayarları aç"
                title="Ayarlar"
              >
                ⚙
              </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 w-56 rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_98%,white)] p-2 shadow-[var(--shadow-strong)]">
                  <Link
                    href="/dashboard/profile"
                    onClick={(event) => {
                      handleProtectedNavigation(event, "/dashboard/profile");
                      setMenuOpen(false);
                    }}
                    className="block rounded-2xl px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  >
                    Profil
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setBugModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="block w-full rounded-2xl px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  >
                    Hata Bildir
                  </button>
                  {role !== "student" && (
                    <Link
                      href="/dashboard/admin"
                      onClick={(event) => {
                        handleProtectedNavigation(event, "/dashboard/admin");
                        setMenuOpen(false);
                      }}
                      className="block rounded-2xl px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                    >
                      Admin
                    </Link>
                  )}
                  <div className="mt-1 border-t border-[var(--border)] pt-2">
                    <ThemeToggle />
                  </div>
                  <div className="mt-2 border-t border-[var(--border)] pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    >
                      {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
                    </button>
                  </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 sm:mt-0 sm:hidden">
            <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] px-2.5 py-2 text-[11px] font-medium shadow-[var(--shadow-soft)]">
              <span className={`h-2.5 w-2.5 rounded-full ${courseStatus.dotClass}`} />
              <span className={`truncate ${courseStatus.textClass}`}>{courseStatus.label}</span>
            </div>

            <div className="rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] px-2.5 py-2 text-[11px] font-medium text-[var(--foreground-muted)] shadow-[var(--shadow-soft)]">
              {formatClock(now)}
            </div>
          </div>
        </div>
      </header>
      <BugReportModal open={bugModalOpen} onClose={() => setBugModalOpen(false)} />
    </>
  );
}
