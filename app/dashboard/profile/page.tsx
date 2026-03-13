"use client";

import AppNavbar from "@/components/ui/AppNavbar";
import { useEffect, useState } from "react";
import { getUser, getUserProfile, signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
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
      setName(profile.data?.name || data.user.user_metadata?.name || "Kullanıcı");
      setRole(profile.data?.role || "student");
      setUserEmail(data.user.email || "");
      setLoading(false);
    }

    loadUser();
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
        <div className="mx-auto w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-md">
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

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Ad Soyad</p>
              <p className="mt-2 font-medium text-[var(--foreground)]">{name}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">E-posta</p>
              <p className="mt-2 font-medium text-[var(--foreground)]">{userEmail}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Rol</p>
              <p className="mt-2 font-medium capitalize text-[var(--foreground)]">
                {role === "admin" ? "Admin" : "Öğrenci"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
