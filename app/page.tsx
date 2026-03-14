import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_94%,white)] shadow-[0_24px_80px_rgba(35,31,26,0.12)]">
        <section className="grid gap-8 border-b border-[var(--border)] px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
              Kurs Soru Platformu
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Konuyu seç, odaklan, soruyu çöz.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
              Sınıf kullanımı için tasarlanmış sade bir soru bankası. Öğrenciler soru ekler,
              admin onaylar, herkes aynı akıştan ilerler.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)]"
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-transparent px-5 py-3 text-sm font-semibold"
              >
                Kayıt Ol
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
              Hızlı Bakış
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
                <p className="text-sm font-semibold">Soru çöz</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Dört şıklı sorular, anında cevap kontrolü ve açıklama.
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
                <p className="text-sm font-semibold">Soru ekle</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Yeni sorular önce beklemeye alınır, sonra admin onaylar.
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface)] px-4 py-3">
                <p className="text-sm font-semibold">Konu bazlı çalışma</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Tüm konular ya da seçili konu üzerinden düzenli ilerleme.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10 sm:py-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold">Tek akış</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Öğrenci, admin ve çözüm ekranı aynı sade yapı içinde çalışır.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold">Mobil öncelikli</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Telefonda hızlı erişim, masaüstünde temiz ve ortalanmış deneyim.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold">Kontrollü içerik</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Duplicate uyarısı ve admin onayı ile içerik kalitesi korunur.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
