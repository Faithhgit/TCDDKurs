"use client";

import AppNavbar from "@/components/ui/AppNavbar";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchQuestionsByTopic, fetchTopics, type QuestionRow, type TopicRow } from "@/lib/questions";

type TopicFilterValue = "all" | number;
type SortMode = "ordered" | "random";

function shuffleQuestions(items: QuestionRow[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
}

export default function SolvePage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<TopicFilterValue>("all");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choice, setChoice] = useState<"A" | "B" | "C" | "D" | "">("");
  const [feedback, setFeedback] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("ordered");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const topicsRes = await fetchTopics();
      setTopics((topicsRes.data ?? []) as TopicRow[]);
      setLoading(false);
    }

    void loadData();
  }, []);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      const topicId = selectedTopicId === "all" ? null : selectedTopicId;
      const { data } = await fetchQuestionsByTopic(topicId);
      const list = (data ?? []) as QuestionRow[];
      setQuestions(sortMode === "random" ? shuffleQuestions(list) : list);
      setCurrentIndex(0);
      setChoice("");
      setFeedback("");
      setShowExplanation(false);
      setLoading(false);
    }

    void loadQuestions();
  }, [selectedTopicId, sortMode]);

  const currentQuestion = useMemo(() => questions[currentIndex] ?? null, [questions, currentIndex]);

  function resetAnswerState() {
    setChoice("");
    setFeedback("");
    setShowExplanation(false);
  }

  function handleAnswer(selected: "A" | "B" | "C" | "D") {
    if (!currentQuestion || choice) return;

    setChoice(selected);
    const isCorrect = selected === currentQuestion.correct_option;
    setFeedback(
      isCorrect
        ? "Doğru cevap."
        : `Yanlış cevap. Doğru seçenek: ${currentQuestion.correct_option}`
    );
    setShowExplanation(true);
  }

  function nextQuestion() {
    if (!questions.length) return;
    setCurrentIndex((prev) => (prev + 1 < questions.length ? prev + 1 : 0));
    resetAnswerState();
  }

  function previousQuestion() {
    if (!questions.length) return;
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : questions.length - 1));
    resetAnswerState();
  }

  const selectedTopicLabel =
    selectedTopicId === "all"
      ? "Tüm Konular"
      : topics.find((topic) => topic.id === selectedTopicId)?.title ?? "Konu";

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_94%,white)] p-5 shadow-[0_24px_80px_rgba(35,31,26,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)]">Soru Çöz</p>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Konu Bazlı Soru Çöz</h1>
              <p className="text-sm text-[var(--foreground-muted)]">
                Onaylı soruları çöz, sonucu anında gör.
              </p>
            </div>
            <Link
              href="/dashboard/add-question"
              className="inline-flex min-h-11 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              Soru Ekle
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Konu Seç</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="mt-1 min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
                disabled={!topics.length}
              >
                <option value="all">Tüm Konular</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Sıralama</label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="mt-1 min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
              >
                <option value="ordered">Eklenme sırasına göre</option>
                <option value="random">Karışık sırayla</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
              Sorular yükleniyor...
            </div>
          ) : !topics.length ? (
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
              Henüz aktif konu bulunmuyor. Önce admin panelinden konu eklenmeli.
            </div>
          ) : !currentQuestion ? (
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
              {selectedTopicLabel} için henüz onaylı soru yok.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--foreground-muted)]">
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 uppercase tracking-[0.16em]">
                  {selectedTopicLabel}
                </span>
                <div className="flex items-center gap-2">
                  {!choice && questions.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={previousQuestion}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)]"
                        aria-label="Önceki soru"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={nextQuestion}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)]"
                        aria-label="Sonraki soru"
                      >
                        →
                      </button>
                    </>
                  )}
                  <span className="font-medium">
                    {currentIndex + 1} / {questions.length}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[32px] border border-[color:color-mix(in_srgb,var(--primary)_30%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_88%,#fff),color-mix(in_srgb,var(--surface-muted)_82%,#fff))] px-6 py-8 sm:px-7 sm:py-9">
                <h2 className="break-words text-2xl font-semibold leading-9 text-[var(--foreground)] sm:text-[2rem] sm:leading-10 [overflow-wrap:anywhere]">
                  {currentQuestion.question_text}
                </h2>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                  Hazırlayan: {currentQuestion.created_by_name || "Bilinmiyor"}
                </p>
              </div>

              <div className="grid gap-3">
                {(["A", "B", "C", "D"] as const).map((option) => {
                  const text = currentQuestion[`option_${option.toLowerCase()}` as keyof QuestionRow] as string;
                  const isSelected = choice === option;
                  const isCorrect = choice && currentQuestion.correct_option === option;
                  const isWrongChoice = isSelected && currentQuestion.correct_option !== option;

                  let className =
                    "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]";

                  if (isCorrect) {
                    className = "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200";
                  } else if (isWrongChoice) {
                    className = "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200";
                  } else if (isSelected) {
                    className = "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,var(--surface))] text-[var(--foreground)]";
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${className}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/6 text-sm font-semibold dark:bg-white/10">
                          {option}
                        </span>
                        <span className="break-words text-sm leading-6 [overflow-wrap:anywhere]">
                          {text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    choice === currentQuestion.correct_option
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
                  }`}
                >
                  {feedback}
                </div>
              )}

              {showExplanation && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--foreground-muted)]">
                  <p className="font-semibold text-[var(--foreground)]">Açıklama</p>
                  <p className="mt-1 break-words [overflow-wrap:anywhere]">
                    {currentQuestion.explanation?.trim() || "Bu soru için henüz açıklama eklenmemiş."}
                  </p>
                </div>
              )}

              {choice && (
                <button
                  onClick={nextQuestion}
                  className="min-h-12 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--surface)]"
                >
                  Sonraki Soru
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
