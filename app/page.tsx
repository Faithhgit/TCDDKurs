import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <section className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(20,184,166,0.06))] px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
            Kurs Soru Platformu
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Konu seç, soruyu çöz, yeni soru ekle.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
            Sınıf içi kullanıma uygun, sade ve mobil uyumlu bir soru çözme platformu.
            Öğrenciler soru ekler, admin onaylar, herkes aynı sistem üzerinden çalışır.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)]"
            >
              Giriş Yap
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold"
            >
              Kayıt Ol
            </Link>
          </div>
        </section>

        <section className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10 sm:py-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold">Soru çözme</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Konu bazlı ilerle, 4 şıklı soruları tek tek çöz, doğru cevabı ve açıklamayı anında gör.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold">Soru ekleme</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Yeni sorularını kolay form üzerinden gönder. Aynı soru varsa sistem uyarı verir.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm font-semibold">Admin onayı</p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Bekleyen sorular ayrı listede toplanır. Onaylanan içerikler çözüm ekranına düşer.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
