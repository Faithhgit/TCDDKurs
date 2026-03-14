"use client";

import AppNavbar from "@/components/ui/AppNavbar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteQuestion,
  fetchPendingQuestions,
  fetchQuestionsForAdmin,
  fetchTopics,
  updateQuestion,
  updateQuestionStatus,
  type QuestionRow,
  type QuestionStatus,
  type TopicRow,
} from "@/lib/questions";
import { supabase } from "@/lib/supabaseClient";
import { getUserProfile } from "@/lib/auth";
import { normalizeQuestionText } from "@/utils/normalize";

type StatusFilter = "all" | QuestionStatus;
type TopicFilter = "all" | number;

const optionKeys = [
  { label: "A", key: "option_a" },
  { label: "B", key: "option_b" },
  { label: "C", key: "option_c" },
  { label: "D", key: "option_d" },
] as const;

function getStatusBadgeClass(status: QuestionStatus) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200";
  }

  if (status === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200";
  }

  return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200";
}

function getStatusLabel(status: QuestionStatus) {
  if (status === "approved") return "Onaylandı";
  if (status === "rejected") return "Reddedildi";
  return "Beklemede";
}

export default function AdminPage() {
  const [pending, setPending] = useState<QuestionRow[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuestionRow[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRow | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function refreshData() {
    const [topicsRes, pendingRes, allRes] = await Promise.all([
      fetchTopics(true),
      fetchPendingQuestions(),
      fetchQuestionsForAdmin(),
    ]);

    setTopics((topicsRes.data ?? []) as TopicRow[]);
    setPending((pendingRes.data ?? []) as QuestionRow[]);
    setAllQuestions((allRes.data ?? []) as QuestionRow[]);
  }

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) {
        router.push("/auth/login");
        return;
      }

      const profile = await getUserProfile(user.user.id);
      if (!profile.data || profile.data.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      await refreshData();
      setLoading(false);
    }

    void load();
  }, [router]);

  async function changeStatus(id: number, status: "approved" | "rejected") {
    setMessage("");
    const { error } = await updateQuestionStatus(id, status);
    if (error) {
      setMessage(error.message || "Durum güncellenemedi.");
      return;
    }

    setMessage(status === "approved" ? "Soru onaylandı." : "Soru reddedildi.");
    await refreshData();
    if (selectedQuestion?.id === id) {
      setSelectedQuestion((current) => (current ? { ...current, status } : current));
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Bu soruyu silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    setMessage("");
    const { error } = await deleteQuestion(id);
    if (error) {
      setMessage(error.message || "Soru silinemedi.");
      return;
    }

    setMessage("Soru silindi.");
    setSelectedQuestion((current) => (current?.id === id ? null : current));
    await refreshData();
  }

  async function handleSaveQuestion() {
    if (!selectedQuestion) return;

    setSaving(true);
    setMessage("");

    const normalized = normalizeQuestionText(selectedQuestion.question_text);
    const { error } = await updateQuestion(selectedQuestion.id, {
      topic_id: selectedQuestion.topic_id,
      question_text: selectedQuestion.question_text.trim(),
      option_a: selectedQuestion.option_a.trim(),
      option_b: selectedQuestion.option_b.trim(),
      option_c: selectedQuestion.option_c.trim(),
      option_d: selectedQuestion.option_d.trim(),
      correct_option: selectedQuestion.correct_option,
      explanation: selectedQuestion.explanation?.trim() || null,
      normalized_question_text: normalized,
      status: selectedQuestion.status,
      created_by_name: selectedQuestion.created_by_name.trim(),
    });

    setSaving(false);

    if (error) {
      setMessage(error.message || "Soru güncellenemedi.");
      return;
    }

    setMessage("Soru bilgileri güncellendi.");
    await refreshData();
  }

  const topicMap = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic.title])),
    [topics]
  );

  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr-TR");

    return allQuestions.filter((question) => {
      const matchesStatus = statusFilter === "all" || question.status === statusFilter;
      const matchesTopic = topicFilter === "all" || question.topic_id === topicFilter;
      const matchesQuery =
        !query ||
        question.question_text.toLocaleLowerCase("tr-TR").includes(query) ||
        question.created_by_name.toLocaleLowerCase("tr-TR").includes(query);

      return matchesStatus && matchesTopic && matchesQuery;
    });
  }, [allQuestions, searchQuery, statusFilter, topicFilter]);

  if (loading) {
    return <div className="min-h-screen bg-[var(--background)] p-4">Yükleniyor...</div>;
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <AppNavbar />
        <div className="p-4 sm:p-8">
          <div className="mx-auto w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Yetkiniz yok</h1>
            <p className="mt-2 text-[var(--foreground-muted)]">
              Bu sayfayı sadece admin kullanıcılar görüntüleyebilir.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 rounded-2xl bg-[var(--primary)] px-4 py-2 font-semibold text-[var(--primary-foreground)]"
            >
              Ana Sayfa
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 xl:flex-row">
          <section className="flex-1 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">Admin Paneli</p>
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">Yönetim</h1>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Bekleyen soruları yönet, tüm soru havuzunu düzenle.
                </p>
              </div>
              <Link
                href="/dashboard/admin/topics"
                className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm"
              >
                Konu Yönetimi
              </Link>
            </div>

            {message && (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                {message}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-sm text-[var(--foreground-muted)]">Bekleyen Sorular</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{pending.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-sm text-[var(--foreground-muted)]">Toplam Sorular</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{allQuestions.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-sm text-[var(--foreground-muted)]">Toplam Konular</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{topics.length}</p>
              </div>
            </div>

            <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Bekleyen Sorular ({pending.length})
              </h2>

              {pending.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">
                  Bekleyen soru yok.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {pending.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {question.question_text}
                          </p>
                          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                            {question.created_by_name} • {topicMap.get(question.topic_id) ?? "Konu yok"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedQuestion(question)}
                            className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold"
                          >
                            Detay
                          </button>
                          <button
                            onClick={() => changeStatus(question.id, "approved")}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => changeStatus(question.id, "rejected")}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Reddet
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Tüm Sorular ({filteredQuestions.length})
                </h2>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Soru veya hazırlayan ara"
                  className="min-h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
                />
                <select
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="min-h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
                >
                  <option value="all">Tüm konular</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="min-h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"
                >
                  <option value="all">Tüm durumlar</option>
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </div>

              <div className="mt-3 space-y-3">
                {filteredQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">
                    Bu filtrede soru bulunamadı.
                  </div>
                ) : (
                  filteredQuestions.map((question) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setSelectedQuestion(question)}
                      className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {question.question_text}
                          </p>
                          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                            {topicMap.get(question.topic_id) ?? "Konu yok"} • {question.created_by_name}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getStatusBadgeClass(question.status)}`}
                        >
                          {getStatusLabel(question.status)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </section>

          <aside className="w-full xl:max-w-xl">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Soru Detayı</h2>

              {!selectedQuestion ? (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
                  Soldaki listeden bir soru seçin. Burada düzenleme, durum değiştirme ve silme
                  işlemlerini yapabilirsiniz.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Konu</label>
                    <select
                      value={selectedQuestion.topic_id}
                      onChange={(e) =>
                        setSelectedQuestion({ ...selectedQuestion, topic_id: Number(e.target.value) })
                      }
                      className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                    >
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                      Soru Metni
                    </label>
                    <textarea
                      value={selectedQuestion.question_text}
                      onChange={(e) =>
                        setSelectedQuestion({ ...selectedQuestion, question_text: e.target.value })
                      }
                      className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                    />
                  </div>

                  {optionKeys.map((option) => (
                    <div key={option.key}>
                      <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                        {option.label} Şıkkı
                      </label>
                      <input
                        value={selectedQuestion[option.key]}
                        onChange={(e) =>
                          setSelectedQuestion({
                            ...selectedQuestion,
                            [option.key]: e.target.value,
                          })
                        }
                        className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                      />
                    </div>
                  ))}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                        Doğru Şık
                      </label>
                      <select
                        value={selectedQuestion.correct_option}
                        onChange={(e) =>
                          setSelectedQuestion({
                            ...selectedQuestion,
                            correct_option: e.target.value as QuestionRow["correct_option"],
                          })
                        }
                        className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                        Durum
                      </label>
                      <select
                        value={selectedQuestion.status}
                        onChange={(e) =>
                          setSelectedQuestion({
                            ...selectedQuestion,
                            status: e.target.value as QuestionStatus,
                          })
                        }
                        className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                      >
                        <option value="pending">Beklemede</option>
                        <option value="approved">Onaylandı</option>
                        <option value="rejected">Reddedildi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                      Hazırlayan
                    </label>
                    <input
                      value={selectedQuestion.created_by_name}
                      onChange={(e) =>
                        setSelectedQuestion({ ...selectedQuestion, created_by_name: e.target.value })
                      }
                      className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                      Açıklama
                    </label>
                    <textarea
                      value={selectedQuestion.explanation ?? ""}
                      onChange={(e) =>
                        setSelectedQuestion({ ...selectedQuestion, explanation: e.target.value })
                      }
                      className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleSaveQuestion}
                      disabled={saving}
                      className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-70"
                    >
                      {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </button>
                    <button
                      onClick={() => changeStatus(selectedQuestion.id, "approved")}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => changeStatus(selectedQuestion.id, "rejected")}
                      className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Reddet
                    </button>
                    <button
                      onClick={() => handleDelete(selectedQuestion.id)}
                      className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Soruyu Sil
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
