"use client";

type AppLoadingScreenProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

function LoadingBar({ className }: { className: string }) {
  return (
    <div
      className={`overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--surface-strong)_74%,white)] ${className}`}
    >
      <div className="h-full w-2/5 animate-pulse rounded-full bg-[color:color-mix(in_srgb,var(--primary)_34%,white)]" />
    </div>
  );
}

export default function AppLoadingScreen({
  eyebrow = "Bir saniye",
  title = "Ekran hazırlanıyor",
  description = "Bir şeyler yerli yerine oturuyor, az kaldı.",
}: AppLoadingScreenProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--surface)_98%,white),color-mix(in_srgb,var(--surface-muted)_84%,white))] p-5 shadow-[var(--shadow-strong)] sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_15%,transparent),transparent_50%)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--warning)_10%,transparent),transparent_68%)]" />

          <div className="relative grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface)_97%,white),color-mix(in_srgb,var(--surface-muted)_88%,white))] p-6 shadow-[var(--shadow-soft)] sm:p-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--border)_90%,white)] bg-[color:color-mix(in_srgb,var(--surface)_82%,white)] px-3 py-1.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--primary)]" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--primary)]">
                  {eyebrow}
                </span>
              </div>

              <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-[15px]">
                {description}
              </p>

              <div className="mt-7 flex items-center gap-4">
                <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--border-strong)_84%,white)] bg-[color:color-mix(in_srgb,var(--primary)_10%,transparent)]">
                  <div className="absolute inset-1 rounded-full border border-[color:color-mix(in_srgb,var(--border)_70%,transparent)]" />
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--primary)]" />
                </div>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <LoadingBar className="h-2.5 w-40 sm:w-52" />
                  <LoadingBar className="h-2.5 w-24 sm:w-32" />
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_70%,white)] px-4 py-4">
                  <div className="h-2 w-16 animate-pulse rounded-full bg-[var(--surface-strong)]" />
                  <div className="mt-4 h-8 w-11 animate-pulse rounded-full bg-[color:color-mix(in_srgb,var(--primary)_18%,white)]" />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_70%,white)] px-4 py-4">
                  <div className="h-2 w-20 animate-pulse rounded-full bg-[var(--surface-strong)]" />
                  <div className="mt-4 h-8 w-16 animate-pulse rounded-full bg-[color:color-mix(in_srgb,var(--primary)_16%,white)]" />
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_70%,white)] px-4 py-4">
                  <div className="h-2 w-14 animate-pulse rounded-full bg-[var(--surface-strong)]" />
                  <div className="mt-4 h-8 w-12 animate-pulse rounded-full bg-[color:color-mix(in_srgb,var(--primary)_14%,white)]" />
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,white),var(--surface))] p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--surface-strong)]" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)]" />
                </div>
                <div className="mt-5 space-y-3">
                  <div className="h-12 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
                  <div className="h-12 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
                  <div className="h-12 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,white),var(--surface))] p-5 shadow-[var(--shadow-soft)]">
                <div className="h-3 w-20 animate-pulse rounded-full bg-[var(--surface-strong)]" />
                <div className="mt-5 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded-full bg-[var(--surface-muted)]" />
                  <div className="h-4 w-11/12 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                  <div className="h-4 w-4/5 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                  <div className="h-4 w-3/5 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                </div>
                <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] px-4 py-4">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--surface-strong)]" />
                  <div className="mt-3 h-10 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
