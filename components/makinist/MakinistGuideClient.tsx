"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import AppNavbar from "@/components/ui/AppNavbar";
import type { MakinistGuideEntry } from "@/lib/makinistGuideData";

type Props = {
  entries: MakinistGuideEntry[];
  lockedMessage?: string | null;
};

function shortSummary(entry: MakinistGuideEntry) {
  if (entry.slug === "jen") {
    return "Jeneratör vagonu için kısa referans başlıkları.";
  }

  if (entry.slug === "kaza") {
    return "Kaza ve olaylarda temel işlem adımları.";
  }

  return `${entry.title} için temel kullanım başlıkları.`;
}

export default function MakinistGuideClient({ entries, lockedMessage }: Props) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showLocomotives, setShowLocomotives] = useState(false);

  const locomotiveEntries = useMemo(
    () => entries.filter((entry) => entry.category === "lokomotif"),
    [entries]
  );
  const helperEntries = useMemo(() => entries.filter((entry) => entry.category === "yardimci"), [entries]);
  const activeEntry = useMemo(() => entries.find((entry) => entry.slug === activeSlug) ?? null, [activeSlug, entries]);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-6xl space-y-5">
          <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface)_97%,white),color-mix(in_srgb,var(--surface-muted)_86%,white))] p-4 shadow-[var(--shadow-strong)] sm:rounded-[32px] sm:p-6">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:mt-3 sm:text-4xl">
              Lokomotif Bilgi Rehberi
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--foreground-muted)] sm:text-base sm:leading-7">
              {lockedMessage
                ? "Bu modül için kullanıcı bazlı erişim uygulanıyor."
                : "Lokomotif serileri, jeneratör vagonları ve kaza / olay başlıkları tek ekranda toplandı. Bir başlık seçip ilgili saha notlarına doğrudan ulaşabilirsin."}
            </p>

            {!lockedMessage ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
              {helperEntries.map((entry) => {
                const isActive = entry.slug === activeSlug;

                return (
                  <button
                    key={entry.slug}
                    type="button"
                    onClick={() => setActiveSlug(entry.slug)}
                    className={[
                      "group overflow-hidden rounded-[28px] border text-left transition",
                      isActive
                        ? "border-[var(--primary)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_86%,var(--primary)_14%),color-mix(in_srgb,var(--surface)_92%,var(--primary)_8%))] shadow-[var(--shadow-soft)]"
                        : "border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface-muted))] hover:border-[var(--border-strong)] hover:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_92%,white),var(--surface))]",
                    ].join(" ")}
                  >
                    <div className="flex min-h-[196px] flex-col justify-between p-4 sm:min-h-[210px] sm:p-5">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--primary)]">Yardımcı İçerik</p>
                            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-2xl">
                              {entry.title}
                            </h2>
                          </div>
                          <span
                            className={[
                              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                              isActive
                                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                                : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)]",
                            ].join(" ")}
                          >
                            {isActive ? "Açık" : "İncele"}
                          </span>
                        </div>

                        <p className="text-sm leading-6 text-[var(--foreground-muted)]">{shortSummary(entry)}</p>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3 sm:mt-5 sm:gap-4">
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--primary)]">İçerik</p>
                          <p className="text-sm text-[var(--foreground)]">{entry.sections.length} başlık</p>
                        </div>

                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_16%,white),transparent_70%),linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_95%,white),var(--surface))] sm:h-24 sm:w-32">
                          <Image
                            src={entry.image}
                            alt={entry.title}
                            fill
                            sizes="128px"
                            className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowLocomotives((value) => !value)}
                className={[
                  "group overflow-hidden rounded-[28px] border text-left transition",
                  showLocomotives
                    ? "border-[var(--primary)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_86%,var(--primary)_14%),color-mix(in_srgb,var(--surface)_92%,var(--primary)_8%))] shadow-[var(--shadow-soft)]"
                    : "border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface-muted))] hover:border-[var(--border-strong)] hover:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_92%,white),var(--surface))]",
                ].join(" ")}
              >
                <div className="flex min-h-[196px] flex-col justify-between p-4 sm:min-h-[210px] sm:p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--primary)]">Lokomotif Serileri</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-2xl">
                          Lokomotifler
                        </h2>
                      </div>
                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                          showLocomotives
                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)]",
                        ].join(" ")}
                      >
                        {showLocomotives ? "Açık" : "Aç"}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                      Tüm lokomotif türlerini tek kart altında toplanmış halde aç.
                    </p>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 sm:mt-5 sm:gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--primary)]">İçerik</p>
                      <p className="text-sm text-[var(--foreground)]">{locomotiveEntries.length} seri</p>
                    </div>

                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_16%,white),transparent_70%),linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_95%,white),var(--surface))] sm:h-24 sm:w-32">
                      <Image
                        src={locomotiveEntries[0]?.image ?? "/makinist/dh7000.png"}
                        alt="Lokomotifler"
                        fill
                        sizes="128px"
                        className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  </div>
                </div>
              </button>
              </div>
            ) : null}

            {!lockedMessage && showLocomotives ? (
              <div className="mt-4 rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface-muted))] p-3.5 sm:rounded-[28px] sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Lokomotif Seçimi</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                      Bir seri seç, alttaki bilgi ekranı açılsın.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {locomotiveEntries.map((entry) => {
                    const isActive = entry.slug === activeSlug;

                    return (
                      <button
                        key={entry.slug}
                        type="button"
                        onClick={() => setActiveSlug(entry.slug)}
                        className={[
                          "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition sm:py-3",
                          isActive
                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]",
                        ].join(" ")}
                      >
                        <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] sm:h-12 sm:w-16">
                          <Image src={entry.image} alt={entry.title} fill sizes="64px" className="object-contain p-1" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{entry.title}</p>
                          <p className="text-[11px] opacity-80 sm:text-xs">{entry.sections.length} başlık</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <section>
            <article
              key={activeEntry?.slug ?? "empty"}
              className="rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-4 shadow-[var(--shadow-soft)] sm:rounded-[28px] sm:p-6"
            >
              {lockedMessage ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface))] px-5 py-8 text-center sm:min-h-[320px] sm:px-6 sm:py-10">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Erişim Bekleniyor</p>
                  <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
                    Bu modül henüz hesabına açılmadı
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)] sm:leading-7">
                    {lockedMessage}
                  </p>
                </div>
              ) : activeEntry ? (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">{activeEntry.title}</p>
                      <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">{activeEntry.subtitle}</h2>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--foreground-muted)] sm:leading-7">
                        {activeEntry.summary}
                      </p>
                    </div>

                    <div className="relative h-24 w-full max-w-[160px] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_14%,white),transparent_70%),linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_95%,white),var(--surface))] sm:h-28 sm:max-w-[180px] sm:rounded-[24px]">
                      <Image
                        src={activeEntry.image}
                        alt={activeEntry.title}
                        fill
                        sizes="180px"
                        className="object-contain p-3"
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {activeEntry.sections.map((section) => (
                      <details
                        key={section.title}
                        className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface-muted))]"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:py-4">
                          <span className="text-sm font-semibold text-[var(--foreground)]">{section.title}</span>
                          <span className="text-xs font-semibold text-[var(--foreground-muted)] transition group-open:rotate-45">
                            +
                          </span>
                        </summary>

                        <div className="border-t border-[var(--border)] px-4 py-4">
                          <ul className="space-y-2 text-sm leading-6 text-[var(--foreground)] sm:leading-7">
                            {section.items.map((item, index) => (
                              <li key={`${section.title}-${index}`} className="flex gap-3">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>

                          {section.warning?.length ? (
                            <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                                Dikkat
                              </p>
                              <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                                {section.warning.map((item, index) => (
                                  <li key={`${section.title}-warning-${index}`} className="flex gap-3">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_94%,white),var(--surface))] px-5 py-8 text-center sm:min-h-[320px] sm:px-6 sm:py-10">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Bilgi Ekranı</p>
                  <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">Önce bir başlık seç</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--foreground-muted)] sm:leading-7">
                    Üstteki kartlardan bir başlık seçildiğinde ilgili içerik burada açılacak.
                  </p>
                </div>
              )}
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
