"use client";

import AppNavbar from "@/components/ui/AppNavbar";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchTopics,
  findDuplicateQuestion,
  findSimilarQuestions,
  insertQuestion,
  type TopicRow,
} from "@/lib/questions";
import { normalizeQuestionText } from "@/utils/normalize";
import { getUserProfile } from "@/lib/auth";

type SimilarQuestion = {
  id: number;
  question_text: string;
  status: string;
  created_by_name?: string;
};

export default function AddQuestionPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicId, setTopicId] = useState(0);
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D" | "">("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);

  const normalizedQuestion = useMemo(() => normalizeQuestionText(question), [question]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/auth/login";
        return;
      }

      const profileRes = await getUserProfile(data.user.id);
      const profileName = profileRes.data?.name?.trim();
      const userMetaName = data.user.user_metadata?.name?.trim();
      const resolvedName =
        profileName && !profileName.includes("@")
          ? profileName
          : userMetaName && !userMetaName.includes("@")
            ? userMetaName
            : "Öğrenci";

      const topicsRes = await fetchTopics();
      if (!isMounted) return;

      setUserId(data.user.id);
      setName(resolvedName);

      if (topicsRes.data) {
        const fetchedTopics = topicsRes.data as TopicRow[];
        setTopics(fetchedTopics);
        if (fetchedTopics.length > 0) {
          setTopicId(fetchedTopics[0].id);
        }
      }

      setPageLoading(false);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCheckSimilar() {
    setError("");

    if (!topicId || normalizedQuestion.length < 12) {
      setSimilarQuestions([]);
      return;
    }

    setCheckingSimilar(true);
    const result = await findSimilarQuestions(normalizedQuestion, topicId);
    setSimilarQuestions((result.data ?? []) as SimilarQuestion[]);
    setCheckingSimilar(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !topicId ||
      !question.trim() ||
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim() ||
      !correctOption
    ) {
      setError("Lütfen tüm zorunlu alanları doldurun ve doğru seçeneği işaretleyin.");
      return;
    }

    if (normalizedQuestion.length < 10) {
      setError("Soru metni çok kısa. En az 10 karakter girin.");
      return;
    }

    setLoading(true);

    const dupe = await findDuplicateQuestion(normalizedQuestion);
    if (dupe.data && dupe.data.length > 0) {
      setLoading(false);
      setError("Bu soru zaten sistemde mevcut. Lütfen farklı bir soru girin.");
      return;
    }

    const finalName = name || "Öğrenci";
    const { error } = await insertQuestion({
      topic_id: topicId,
      question_text: question.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_option: correctOption,
      explanation: explanation.trim() || null,
      created_by_user_id: userId,
      created_by_name: finalName,
      normalized_question_text: normalizedQuestion,
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Soru eklenirken hata oldu.");
      return;
    }

    setSuccess("Soru kaydedildi. Admin onayından sonra yayına alınacak.");
    setQuestion("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("");
    setExplanation("");
    setSimilarQuestions([]);
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Soru Ekle</p>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Yeni Soru Gönder</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Sorular önce beklemeye alınır, sonra admin onaylar.
            </p>
          </div>

          {pageLoading ? (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
              Form hazırlanıyor...
            </div>
          ) : !topics.length ? (
            <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              Henüz aktif konu bulunmuyor. Önce admin panelinden konu eklenmeli.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Konu</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(Number(e.target.value))}
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
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Soru Metni</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                  placeholder="Soruyu açık ve anlaşılır şekilde yazın."
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Metin normalize edilerek tekrar soru kontrolü yapılır.
                  </p>
                  <button
                    type="button"
                    onClick={handleCheckSimilar}
                    disabled={checkingSimilar || normalizedQuestion.length < 12}
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {checkingSimilar ? "Kontrol ediliyor..." : "Benzer Soruları Kontrol Et"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="A şıkkı"
                  className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                />
                <input
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="B şıkkı"
                  className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                />
                <input
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                  placeholder="C şıkkı"
                  className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                />
                <input
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                  placeholder="D şıkkı"
                  className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Doğru Şık</label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value as "A" | "B" | "C" | "D" | "")}
                  className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                >
                  <option value="">Seç</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Açıklama
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                  placeholder="İstersen çözüm mantığını burada açıklayabilirsin."
                />
              </div>

              {similarQuestions.length > 0 && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="font-semibold">Buna benzeyen sorular olabilir.</p>
                  <ul className="mt-2 space-y-2">
                    {similarQuestions.map((item) => (
                      <li key={item.id} className="rounded-xl bg-white/70 px-3 py-2 dark:bg-black/10">
                        <p>{item.question_text}</p>
                        <p className="mt-1 text-xs opacity-80">
                          Durum: {item.status}
                          {item.created_by_name ? ` • Hazırlayan: ${item.created_by_name}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading}
                className="min-h-12 rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-[var(--primary-foreground)] disabled:opacity-70"
              >
                {loading ? "Gönderiliyor..." : "Soruyu Gönder"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
