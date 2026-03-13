"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createUserProfile, registerWithEmail, signInWithEmail } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email || !password) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    setLoading(true);
    const { data, error } = await registerWithEmail(email, password, name.trim());

    if (error) {
      setLoading(false);
      setError(error.message || "Kayıt sırasında bir hata oldu.");
      return;
    }

    const signInResult = await signInWithEmail(email, password);
    if (signInResult.error) {
      setLoading(false);
      setError(signInResult.error.message || "Kayıt tamamlandı fakat giriş yapılamadı.");
      return;
    }

    const userId = signInResult.data.user?.id ?? data?.user?.id;
    if (!userId) {
      setLoading(false);
      setError("Kullanıcı bilgisi alınamadı. Lütfen tekrar deneyin.");
      return;
    }

    const profileResult = await createUserProfile(userId, name.trim());
    if (profileResult.error) {
      setLoading(false);
      setError(`Profil oluşturulamadı: ${profileResult.error.message}`);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Yeni Hesap Oluştur</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Öğrenci hesabını oluştur ve soru çözmeye başla.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Ad Soyad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none focus:border-[var(--primary)]"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">E-posta</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none focus:border-[var(--primary)]"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Şifre</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none focus:border-[var(--primary)]"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-[var(--primary-foreground)] disabled:opacity-70"
          >
            {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-4 text-sm text-[var(--foreground-muted)]">
          Zaten hesabın var mı?{" "}
          <Link href="/auth/login" className="font-semibold text-[var(--primary)]">
            Giriş Yap
          </Link>
        </p>
      </div>
    </main>
  );
}
