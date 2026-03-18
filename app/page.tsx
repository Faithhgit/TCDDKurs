import Link from "next/link";

import AdsenseBanner from "@/components/ui/AdsenseBanner";

const quickCards = [
  {
    title: "Soru çöz",
    description: "Klasik Mod, Doğru / Yanlış ve Quiz aynı yerde duruyor.",
  },
  {
    title: "Soru ekle",
    description: "Kendi sorunu bırakabilir, gerekirse görsel de ekleyebilirsin.",
  },
  {
    title: "Ders akışı",
    description: "Duyurular, ders durumu ve sınıf bilgileri ana ekranda seni bekliyor.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <AdsenseBanner />

        <div className="overflow-hidden rounded-[38px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_97%,white),color-mix(in_srgb,var(--surface-muted)_82%,white))] shadow-[var(--shadow-strong)]">
          <section className="grid gap-6 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
                Kurs İçi Çalışma Alanı
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl lg:text-[3.5rem]">
                Konuyu seç, soruya gir, devam et.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
                Bu alan tamamen bizim ekip için. Soruları ekleriz, çözeriz, lazım olursa düzeltiriz.
                Kısacası boş boş dolanmak yok, direkt işe giriyoruz.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-soft)] transition hover:translate-y-[-1px]"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[color:color-mix(in_srgb,var(--surface)_92%,white)] px-6 py-3 text-sm font-semibold shadow-[var(--shadow-soft)] transition hover:bg-[var(--surface)]"
                >
                  Kayıt Ol
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_92%,white),color-mix(in_srgb,var(--surface-muted)_78%,white))] p-5 shadow-[var(--shadow-soft)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                    Hızlı Bakış
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">İçeride ne var?</h2>
                </div>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  Hazır
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {quickCards.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[22px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_94%,white)] px-4 py-3.5"
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <AdsenseBanner />
      </div>
    </main>
  );
}
