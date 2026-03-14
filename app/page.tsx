import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] shadow-[var(--shadow-strong)]">
        <section className="grid gap-8 border-b border-[var(--border)] px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">
              Kurs İçi Soru Alanı
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Konuyu seç, soruya gir, devam et.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
              Bu alan tamamen bizim ekip için. Soruları ekleriz, çözeriz, lazım olursa düzeltiriz.
              Kısacası boş boş dolanmak yok, direkt işe giriyoruz.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-soft)]"
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold"
              >
                Kayıt Ol
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_86%,white),var(--surface-muted))] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
              Kısaca Nasıl İşliyor?
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="text-sm font-semibold">Soru çöz</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Dört şık var, cevabı işaretliyorsun, sonucu anında görüyorsun.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="text-sm font-semibold">Soru ekle</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Yeni soru bırakabiliyorsun. Gerekirse admin bakıyor, onaylıyor.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="text-sm font-semibold">Konuya göre ilerle</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Tüm konulara dalabilir ya da tek bir konuya odaklanabilirsin.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10 sm:py-8">
          <div className="rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-muted)_90%,white)] p-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold">Aynı yerde kalıyoruz</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Çözüm ekranı, soru ekleme ve admin tarafı aynı düzen içinde akıyor.
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-muted)_90%,white)] p-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold">Telefonda da rahat</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Hızlı açılır, rahat basılır, ekranda saçma taşmalar yapmaz.
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface-muted)_90%,white)] p-4 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold">İçerik biraz kontrollü</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Aynı sorunun tekrar tekrar düşmemesi için temel kontroller var.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
