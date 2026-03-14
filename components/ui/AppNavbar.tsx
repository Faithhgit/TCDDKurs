"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "@/components/ui/ThemeToggle";
import BugReportModal from "@/components/ui/BugReportModal";

const routes = [
  { href: "/dashboard", label: "Ana Sayfa" },
  { href: "/dashboard/solve", label: "Soru Çöz" },
  { href: "/dashboard/add-question", label: "Soru Ekle" },
];

export default function AppNavbar() {
  const path = usePathname();
  const [role, setRole] = useState<"student" | "admin" | "manager">("student");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[color:color-mix(in_srgb,var(--border)_90%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {routes.map((route) => {
              const isActive = path === route.href;

              return (
                <Link
                  key={route.href}
                  href={route.href}
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
                  onClick={() => setMenuOpen(false)}
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
                    onClick={() => setMenuOpen(false)}
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
      </header>
      <BugReportModal open={bugModalOpen} onClose={() => setBugModalOpen(false)} />
    </>
  );
}
