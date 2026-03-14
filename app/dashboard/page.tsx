"use client";

import Link from "next/link";
import AppNavbar from "@/components/ui/AppNavbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, getUserProfile, signOut, syncUserProfileEmail } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

        setName(profile.name || data.user.user_metadata?.name || data.user.email || "Öğrenci");
        setIsAdmin(profile.role === "admin");
      } else {
        setName(data.user.user_metadata?.name || data.user.email || "Öğrenci");
      }

      setLoading(false);
    }

    void load();
  }, [router]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return <div className="min-h-screen bg-[var(--background)] p-4">Yükleniyor...</div>;
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-4xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Dashboard</p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Hoş geldin, {name}</h1>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Konu seçip soru çözmeye ve yeni soru eklemeye başlayabilirsin.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-2xl bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--surface)]"
            >
              Çıkış Yap
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href="/dashboard/solve"
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-center text-sm font-semibold"
            >
              Soru Çöz
            </Link>
            <Link
              href="/dashboard/add-question"
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-center text-sm font-semibold"
            >
              Soru Ekle
            </Link>
            <Link
              href="/dashboard/profile"
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-center text-sm font-semibold"
            >
              Profil
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-center text-sm font-semibold"
              >
                Admin
              </Link>
            )}
          </div>

          <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">İlk kullanım sırası</h2>
            <ul className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--foreground-muted)]">
              <li>Admin panelinden aktif konuları kontrol et.</li>
              <li>Yeni sorular ekle ve onay sürecine gönder.</li>
              <li>Onaylanan soruları çözme ekranında test et.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
