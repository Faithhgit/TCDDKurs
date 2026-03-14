"use client";

import AppNavbar from "@/components/ui/AppNavbar";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import { useEffect, useState } from "react";
import { getUser, getUserProfile, signOut, syncUserProfileEmail } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { fetchQuestionsByUser } from "@/lib/questions";

type QuestionStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [stats, setStats] = useState<QuestionStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
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

      const questions = await fetchQuestionsByUser(data.user.id);
      const questionStats = (questions.data ?? []).reduce<QuestionStats>(
        (acc, item) => {
          acc.total += 1;
          if (item.status === "pending") acc.pending += 1;
          if (item.status === "approved") acc.approved += 1;
          if (item.status === "rejected") acc.rejected += 1;
          return acc;
        },
        { total: 0, pending: 0, approved: 0, rejected: 0 }
      );

      setName(profile.data?.name || data.user.user_metadata?.name || "Kullanıcı");
      setRole(profile.data?.role || "student");
      setUserEmail(data.user.email || "");
      setStats(questionStats);
      setLoading(false);
    }

    void loadUser();
  }, [router]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <AppLoadingScreen
        eyebrow="Profil"
        title="Profil bilgilerin hazırlanıyor"
        description="Hesabın ve soru özetin getiriliyor."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Profil</p>
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">Hesap Bilgileri</h1>
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
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                  Ad Soyad
                </p>
                <p className="mt-2 font-medium text-[var(--foreground)]">{name}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                  E-posta
                </p>
                <p className="mt-2 break-all font-medium text-[var(--foreground)]">{userEmail}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                  Rol
                </p>
                <p className="mt-2 font-medium capitalize text-[var(--foreground)]">
                  {role === "admin" ? "Admin" : "Öğrenci"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">
              Sorduğun Sorular
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              Toplam {stats.total} soru ekledin
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex min-h-24 flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-[11px] font-medium text-[var(--foreground-muted)] sm:text-xs sm:uppercase sm:tracking-[0.16em]">
                  Toplam
                </p>
                <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{stats.total}</p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                <p className="text-[11px] font-medium text-amber-800 sm:text-xs sm:uppercase sm:tracking-[0.16em] dark:text-amber-200">
                  Beklemede
                </p>
                <p className="mt-3 text-2xl font-semibold text-amber-900 dark:text-amber-100">
                  {stats.pending}
                </p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                <p className="text-[11px] font-medium text-emerald-800 sm:text-xs sm:uppercase sm:tracking-[0.16em] dark:text-emerald-200">
                  Onaylandı
                </p>
                <p className="mt-3 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
                  {stats.approved}
                </p>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
                <p className="text-[11px] font-medium text-rose-800 sm:text-xs sm:uppercase sm:tracking-[0.16em] dark:text-rose-200">
                  Reddedildi
                </p>
                <p className="mt-3 text-2xl font-semibold text-rose-900 dark:text-rose-100">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
