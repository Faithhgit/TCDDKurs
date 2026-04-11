"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppNavbar from "@/components/ui/AppNavbar";
import AppButton from "@/components/ui/AppButton";
import { getUserProfile } from "@/lib/auth";
import { authorizedFetch } from "@/lib/clientApi";
import { type TopicRow } from "@/lib/questions";
import { supabase } from "@/lib/supabaseClient";

function toSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-ğüşiöç]/gi, "")
    .replace(/-+/g, "-");
}

export default function TopicsAdminPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [toggleTopicId, setToggleTopicId] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editActive, setEditActive] = useState(true);

  async function refreshTopics() {
    const response = await authorizedFetch("/api/admin/topics", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json().catch(() => null)) as { items?: TopicRow[] } | null;
    setTopics(payload?.items ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      const profile = await getUserProfile(data.user.id);
      if (!profile.data || profile.data.role !== "manager") {
        setUnauthorized(true);
        setPageLoading(false);
        return;
      }

      const response = await authorizedFetch("/api/admin/topics", {
        method: "GET",
        cache: "no-store",
      });

      const payload = response.ok
        ? ((await response.json().catch(() => null)) as { items?: TopicRow[] } | null)
        : null;

      startTransition(() => {
        setTopics(payload?.items ?? []);
        setPageLoading(false);
      });
    }

    void load();
  }, [router]);

  function resetEditForm() {
    setEditingTopicId(null);
    setEditTitle("");
    setEditSlug("");
    setEditActive(true);
  }

  async function handleAddTopic() {
    setMessage("");

    if (!title.trim()) {
      setMessage("Lütfen konu başlığı gir.");
      return;
    }

    const finalSlug = toSlug(slug || title);
    if (!finalSlug) {
      setMessage("Geçerli bir slug üretilemedi.");
      return;
    }

    if (topics.some((topic) => topic.slug === finalSlug)) {
      setMessage("Bu slug zaten kullanılıyor.");
      return;
    }

    setAddLoading(true);
    const response = await authorizedFetch("/api/admin/topics", {
      method: "POST",
      body: JSON.stringify({ title: title.trim(), slug: finalSlug }),
    });
    setAddLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "Konu eklenemedi.");
      return;
    }

    setTitle("");
    setSlug("");
    setMessage("Konu eklendi.");
    await refreshTopics();
  }

  function startEditing(topic: TopicRow) {
    setEditingTopicId(topic.id);
    setEditTitle(topic.title);
    setEditSlug(topic.slug);
    setEditActive(Boolean(topic.is_active));
    setMessage("");
  }

  async function handleSaveTopic() {
    if (!editingTopicId) return;

    const finalSlug = toSlug(editSlug || editTitle);
    if (!editTitle.trim() || !finalSlug) {
      setMessage("Konu başlığı ve slug zorunlu.");
      return;
    }

    if (topics.some((topic) => topic.slug === finalSlug && topic.id !== editingTopicId)) {
      setMessage("Bu slug başka bir konuda kullanılıyor.");
      return;
    }

    setEditLoading(true);
    const response = await authorizedFetch(`/api/admin/topics/${editingTopicId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: editTitle.trim(),
        slug: finalSlug,
        is_active: editActive,
      }),
    });
    setEditLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "Konu güncellenemedi.");
      return;
    }

    setMessage("Konu güncellendi.");
    resetEditForm();
    await refreshTopics();
  }

  async function toggleActive(topic: TopicRow) {
    setMessage("");
    setToggleTopicId(topic.id);
    const response = await authorizedFetch(`/api/admin/topics/${topic.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !topic.is_active }),
    });
    setToggleTopicId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error ?? "Konu durumu güncellenemedi.");
      return;
    }

    setMessage(topic.is_active ? "Konu pasife alındı." : "Konu tekrar aktifleştirildi.");
    await refreshTopics();
  }

  if (pageLoading) {
    return null;
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <AppNavbar />
        <div className="p-4 sm:p-8">
          <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Burası sadece yöneticiye açık</h1>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Adminler burada konu düzenleyemez.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto w-full max-w-5xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">Konu Yönetimi</p>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Konu Ekle ve Düzenle</h1>
          </div>

          {message && (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
              {message}
            </div>
          )}

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Yeni Konu</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  value={title}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTitle(value);
                    if (!slug) setSlug(toSlug(value));
                  }}
                  placeholder="Konu başlığı"
                  className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                />
                <input
                  value={slug}
                  onChange={(e) => setSlug(toSlug(e.target.value))}
                  placeholder="slug"
                  className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                />
              </div>
              <AppButton
                onClick={handleAddTopic}
                loading={addLoading}
                loadingText="Kaydediliyor..."
                className="mt-3"
              >
                Konu Ekle
              </AppButton>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Konu Düzenle</h2>
              {!editingTopicId ? (
                <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                  Aşağıdaki listeden bir konu seçildiğinde düzenleme alanı burada açılır.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Konu başlığı"
                    className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                  />
                  <input
                    value={editSlug}
                    onChange={(e) => setEditSlug(toSlug(e.target.value))}
                    placeholder="slug"
                    className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                  />
                  <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                    <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                    Aktif konu olarak kalsın
                  </label>
                  <div className="flex gap-2">
                                        <AppButton onClick={handleSaveTopic} loading={editLoading} loadingText="Kaydediliyor...">
                      Kaydet
                    </AppButton>
                    <AppButton onClick={resetEditForm} variant="outline">
                      Vazgeç
                    </AppButton>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Mevcut Konular</h2>
            {topics.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--foreground-muted)]">Henüz konu eklenmedi.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{topic.title}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {topic.slug} • {topic.is_active ? "Aktif" : "Pasif"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AppButton onClick={() => startEditing(topic)} variant="outline">
                        Düzenle
                      </AppButton>
                      <AppButton
                        onClick={() => toggleActive(topic)}
                        loading={toggleTopicId === topic.id}
                        loadingText="Güncelleniyor..."
                        variant={topic.is_active ? "secondary" : "success"}
                      >
                        {topic.is_active ? "Pasife Al" : "Aktif Et"}
                      </AppButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}






