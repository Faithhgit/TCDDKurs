"use client";

type AppLoadingScreenProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

export default function AppLoadingScreen({
  eyebrow = "Yükleniyor",
  title = "Sayfa hazırlanıyor",
  description = "İçerikler senin için getiriliyor.",
}: AppLoadingScreenProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] p-5 shadow-[var(--shadow-strong)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface)_96%,white),color-mix(in_srgb,var(--surface-muted)_82%,white))] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--foreground-muted)]">
              {description}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--primary)_14%,transparent)]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--primary)]" />
              </span>
              <div className="space-y-2">
                <div className="h-2.5 w-36 animate-pulse rounded-full bg-[var(--surface-strong)]" />
                <div className="h-2.5 w-24 animate-pulse rounded-full bg-[color:color-mix(in_srgb,var(--surface-strong)_72%,white)]" />
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--surface-strong)]" />
              <div className="mt-5 h-8 w-40 animate-pulse rounded-full bg-[color:color-mix(in_srgb,var(--surface-strong)_78%,white)]" />
              <div className="mt-5 space-y-3">
                <div className="h-11 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
                <div className="h-11 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--surface-strong)]" />
              <div className="mt-5 space-y-3">
                <div className="h-4 w-full animate-pulse rounded-full bg-[var(--surface-muted)]" />
                <div className="h-4 w-5/6 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-[var(--surface-muted)]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
