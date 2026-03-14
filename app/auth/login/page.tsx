"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signInWithEmail } from "@/lib/auth";

const RELEASE_VERSION = "2026.03.mvp.1";
const RELEASE_TRIGGER_KEY = "release_notes_trigger";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("E-posta ve şifre girin.");
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      setError(error.message || "Giriş sırasında bir hata oldu.");
      return;
    }

    sessionStorage.setItem(RELEASE_TRIGGER_KEY, RELEASE_VERSION);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Giriş Yap</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          E-posta ve şifrenle hesabına giriş yap.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
              autoComplete="current-password"
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
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-4 text-sm text-[var(--foreground-muted)]">
          Hesabın yok mu?{" "}
          <Link href="/auth/register" className="font-semibold text-[var(--primary)]">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </main>
  );
}
