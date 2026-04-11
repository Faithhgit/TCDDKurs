"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import AppButton from "@/components/ui/AppButton";

import { APP_VERSION } from "@/lib/appConfig";
import { updatePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setReady(Boolean(session));
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(Boolean(session));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Yeni şifre alanlarını boş bırakma.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olsun.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler birbiriyle aynı değil.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Şifre güncellenemedi.");
      return;
    }

    setSuccess("Şifre güncellendi. Birazdan giriş ekranına yönlendirileceksin.");
    window.setTimeout(() => {
      router.push("/auth/login");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_82%,white))] p-6 shadow-[var(--shadow-strong)] sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Yeni Şifre</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
                Yeni şifreni belirle
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-[15px]">
                Maildeki bağlantıyla geldiysen aşağıdan yeni şifreni yaz. Kaydedince girişe dönebilirsin.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
              v{APP_VERSION}
            </span>
          </div>
        </section>

        <section className="rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="rounded-[26px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_76%,white))] p-5">
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">Şifreyi güncelle</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Güçlü ve hatırlayabileceğin bir şifre seç.
            </p>

            {!ready ? (
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--foreground-muted)]">
                Bu sayfayı maildeki şifre sıfırlama bağlantısından açman gerekiyor.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Yeni şifre</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none transition focus:border-[var(--primary)]"
                    autoComplete="new-password"
                    placeholder="Yeni şifren"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Yeni şifre tekrar</label>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 outline-none transition focus:border-[var(--primary)]"
                    autoComplete="new-password"
                    placeholder="Aynı şifreyi tekrar yaz"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {success}
                  </div>
                )}

                <AppButton
                  type="submit"
                  loading={loading}
                  loadingText="Kaydediliyor..."
                  fullWidth
                  size="lg"
                >
                  Yeni ?ifreyi Kaydet
                </AppButton>
              </form>
            )}
          </div>

          <div className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm leading-6 text-[var(--foreground-muted)]">
              Giriş ekranına dönmek istersen{" "}
              <Link href="/auth/login" className="font-semibold text-[var(--primary)]">
                buraya tıkla
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}



