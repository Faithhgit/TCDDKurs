"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ThemeToggle from "@/components/ui/ThemeToggle";

const routes = [
  { href: "/dashboard", label: "Ana Sayfa" },
  { href: "/dashboard/solve", label: "Soru Çöz" },
  { href: "/dashboard/add-question", label: "Soru Ekle" },
];

export default function AppNavbar() {
  const path = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadRole() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role === "admin") {
        setIsAdmin(true);
      }
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

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur">
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
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
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
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)]"
          >
            Menü
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              >
                Profil
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                >
                  Admin
                </Link>
              )}
              <div className="mt-1 border-t border-[var(--border)] pt-2">
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
