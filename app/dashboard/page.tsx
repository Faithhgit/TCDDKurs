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
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">
                  Çalışma Alanı
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                  Hoş geldin, {name}
                </h1>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">
                  Bugün hangi akıştan devam edeceğine buradan karar ver. Soru çözebilir,
                  yeni soru ekleyebilir ve hesabını kontrol edebilirsin.
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                Çıkış Yap
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Link
              href="/dashboard/solve"
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:bg-[var(--surface-muted)]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Çözüm</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Soru Çöz</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                Konu seç, soruları sırayla çöz ve açıklamayı anında gör.
              </p>
            </Link>
            <Link
              href="/dashboard/add-question"
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:bg-[var(--surface-muted)]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Katkı</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Soru Ekle</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                Yeni sorunu ekle, beklemeye gönder ve admin onayını bekle.
              </p>
            </Link>
            <Link
              href="/dashboard/profile"
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:bg-[var(--surface-muted)]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Hesap</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Profil</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                Kendi bilgilerini ve eklediğin soru özetini görüntüle.
              </p>
            </Link>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">
                Başlangıç Akışı
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                İlk kullanım sırası
              </h2>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--foreground-muted)]">
                <li>1. Önce çözmek istediğin konuyu belirle.</li>
                <li>2. Soru çöz ekranında akışın doğru çalıştığını kontrol et.</li>
                <li>3. Yeni soru ekleyip bekleme sürecini test et.</li>
                {isAdmin && <li>4. Admin panelinden kullanıcı ve soru akışını yönet.</li>}
              </ol>
            </div>

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                Hızlı Erişim
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                Bugün nereden başlayacaksın?
              </h2>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/dashboard/solve"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
                >
                  Soru çöz ekranını aç
                </Link>
                <Link
                  href="/dashboard/add-question"
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
                >
                  Yeni soru gönder
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard/admin"
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
                  >
                    Admin yönetimini aç
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
