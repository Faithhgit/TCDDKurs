"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import AppNavbar from "@/components/ui/AppNavbar";
import { getLocalQuestionImage } from "@/lib/localQuestionImages";
import { getQuestionImagePublicUrl } from "@/lib/questionImages";
import { fetchQuestionsByTopic, fetchTopics, type QuestionRow, type TopicRow } from "@/lib/questions";

type TopicFilterValue = "all" | number;
type SolveMode = "classic" | "true-false" | "quiz" | null;
type AnswerChoice = "A" | "B" | "C" | "D" | "";
type ToastItem = { id: number; message: string };

function shuffleQuestions(list: QuestionRow[]) {
  const next = [...list];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function getModeFromParam(value: string | null): SolveMode {
  if (value === "classic") return "classic";
  if (value === "true-false") return "true-false";
  if (value === "quiz") return "quiz";
  return null;
}

function isTrueFalseQuestion(question: QuestionRow) {
  return (
    question.option_a.trim() === "Doğru" &&
    question.option_b.trim() === "Yanlış" &&
    question.option_c.trim() === "-" &&
    question.option_d.trim() === "-"
  );
}

function getAnswerText(question: QuestionRow, option: Exclude<AnswerChoice, "">) {
  if (option === "A") return question.option_a;
  if (option === "B") return question.option_b;
  if (option === "C") return question.option_c;
  return question.option_d;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function probeSharedQuestionImage(normalizedQuestionText: string) {
  return new Promise<boolean>((resolve) => {
    const probe = new window.Image();
    probe.onload = () => resolve(true);
    probe.onerror = () => resolve(false);
    probe.src = getQuestionImagePublicUrl(normalizedQuestionText);
  });
}

export default function SolvePage() {
  const QUIZ_REVIEW_PAGE_SIZE = 20;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<TopicFilterValue>("all");
  const [selectedMode, setSelectedMode] = useState<SolveMode>(() =>
    getModeFromParam(searchParams.get("mode"))
  );
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choice, setChoice] = useState<AnswerChoice>("");
  const [feedback, setFeedback] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sharedImageAvailability, setSharedImageAvailability] = useState<Record<string, boolean>>({});
  const sharedImageAvailabilityRef = useRef<Record<string, boolean>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<Exclude<SolveMode, null> | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const [quizStartOpen, setQuizStartOpen] = useState(false);
  const [quizFinishOpen, setQuizFinishOpen] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState(40 * 60);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, Exclude<AnswerChoice, "">>>({});
  const [quizQueue, setQuizQueue] = useState<number[]>([]);
  const [quizReviewPage, setQuizReviewPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setSelectedMode(getModeFromParam(searchParams.get("mode")));
  }, [searchParams]);

  useEffect(() => {
    sharedImageAvailabilityRef.current = sharedImageAvailability;
  }, [sharedImageAvailability]);

  useEffect(() => {
    async function loadTopics() {
      setLoading(true);
      const topicsRes = await fetchTopics();
      setTopics((topicsRes.data ?? []) as TopicRow[]);
      setLoading(false);
    }

    void loadTopics();
  }, []);

  useEffect(() => {
    async function loadQuestions() {
      async function enrichImageAvailability(list: QuestionRow[]) {
        const candidates = list.filter(
          (question) =>
            !getLocalQuestionImage(question.normalized_question_text) &&
            sharedImageAvailabilityRef.current[question.normalized_question_text] === undefined
        );

        if (!candidates.length) return;

        const probedEntries = await Promise.all(
          candidates.map(async (question) => [
            question.normalized_question_text,
            await probeSharedQuestionImage(question.normalized_question_text),
          ] as const)
        );

        setSharedImageAvailability((prev) => ({
          ...prev,
          ...Object.fromEntries(probedEntries),
        }));
      }

      if (!selectedMode) {
        setQuestions([]);
        setCurrentIndex(0);
        setChoice("");
        setFeedback("");
        setShowExplanation(false);
        setQuizStartOpen(false);
        setQuizFinishOpen(false);
        setQuizStarted(false);
        setQuizFinished(false);
        setQuizSecondsLeft(40 * 60);
        setQuizAnswers({});
        setQuizQueue([]);
        setQuizReviewPage(1);
        setLoading(false);
        return;
      }

      setLoading(true);

      if (selectedMode === "quiz") {
        const { data } = await fetchQuestionsByTopic(null);
        const allQuestions = ((data ?? []) as QuestionRow[]).filter((question) => !isTrueFalseQuestion(question));
        const quizQuestions = shuffleQuestions(allQuestions).slice(0, 40);

        await enrichImageAvailability(quizQuestions);
        setQuestions(quizQuestions);
        setCurrentIndex(0);
        setChoice("");
        setFeedback("");
        setShowExplanation(false);
        setQuizStartOpen(false);
        setQuizFinishOpen(false);
        setQuizStarted(false);
        setQuizFinished(false);
        setQuizSecondsLeft(40 * 60);
        setQuizAnswers({});
        setQuizQueue(quizQuestions.map((question) => question.id));
        setQuizReviewPage(1);
        setLoading(false);
        return;
      }

      const topicId = selectedTopicId === "all" ? null : selectedTopicId;
      const { data } = await fetchQuestionsByTopic(topicId);
      const allQuestions = (data ?? []) as QuestionRow[];
      const filteredQuestions =
        selectedMode === "true-false"
          ? allQuestions.filter((question) => isTrueFalseQuestion(question))
          : allQuestions.filter((question) => !isTrueFalseQuestion(question));

      const list = shuffleQuestions(filteredQuestions);
      await enrichImageAvailability(list);
      setQuestions(list);
      setCurrentIndex(0);
      setChoice("");
      setFeedback("");
      setShowExplanation(false);
      setLoading(false);
    }

    void loadQuestions();
  }, [selectedMode, selectedTopicId]);

  useEffect(() => {
    if (!quizStarted || quizFinished || selectedMode !== "quiz") return;

    const timer = window.setInterval(() => {
      setQuizSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setQuizFinished(true);
          setQuizStarted(false);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [quizFinished, quizStarted, selectedMode]);

  useEffect(() => {
    if (!quizStarted || quizFinished) return;

    if (quizSecondsLeft === 15 * 60) {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message: "Son 15 dakika." }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    }

    if (quizSecondsLeft === 5 * 60) {
      const id = Date.now() + 1;
      setToasts((prev) => [...prev, { id, message: "Son 5 dakika." }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    }
  }, [quizFinished, quizSecondsLeft, quizStarted]);

  const currentQuestion = useMemo(() => {
    if (selectedMode === "quiz" && quizStarted && !quizFinished) {
      const currentQuizQuestionId = quizQueue[0];
      return questions.find((question) => question.id === currentQuizQuestionId) ?? null;
    }

    return questions[currentIndex] ?? null;
  }, [currentIndex, questions, quizFinished, quizQueue, quizStarted, selectedMode]);

  const localQuestionImage = useMemo(() => {
    if (!currentQuestion) return null;
    return getLocalQuestionImage(currentQuestion.normalized_question_text);
  }, [currentQuestion]);

  const sharedQuestionImage = useMemo(() => {
    if (!currentQuestion) return null;
    return sharedImageAvailability[currentQuestion.normalized_question_text]
      ? getQuestionImagePublicUrl(currentQuestion.normalized_question_text)
      : null;
  }, [currentQuestion, sharedImageAvailability]);

  const selectedTopicLabel =
    selectedTopicId === "all"
      ? "Tüm Konular"
      : topics.find((topic) => topic.id === selectedTopicId)?.title ?? "Konu";

  const isClassicMode = selectedMode === "classic";
  const isTrueFalseMode = selectedMode === "true-false";
  const isQuizMode = selectedMode === "quiz";

  const visibleOptions = useMemo(() => {
    if (!currentQuestion) return [] as Array<"A" | "B" | "C" | "D">;
    return isTrueFalseMode
      ? ([ "A", "B" ] as Array<"A" | "B">)
      : ([ "A", "B", "C", "D" ] as Array<"A" | "B" | "C" | "D">);
  }, [currentQuestion, isTrueFalseMode]);

  const quizStats = useMemo(() => {
    const answeredEntries = Object.entries(quizAnswers);
    const answered = answeredEntries.length;
    const correct = questions.filter((question) => quizAnswers[question.id] === question.correct_option).length;
    const wrong = answered - correct;
    const blank = Math.max(questions.length - answered, 0);

    return { answered, correct, wrong, blank };
  }, [questions, quizAnswers]);

  const pagedQuizQuestions = useMemo(() => {
    const start = (quizReviewPage - 1) * QUIZ_REVIEW_PAGE_SIZE;
    return questions.slice(start, start + QUIZ_REVIEW_PAGE_SIZE);
  }, [questions, quizReviewPage, QUIZ_REVIEW_PAGE_SIZE]);

  const quizReviewPageCount = Math.max(1, Math.ceil(questions.length / QUIZ_REVIEW_PAGE_SIZE));

  function resetAnswerState() {
    setChoice("");
    setFeedback("");
    setShowExplanation(false);
  }

  function openToast(message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }

  function handleAnswer(selected: "A" | "B" | "C" | "D") {
    if (!currentQuestion || choice) return;

    if (isQuizMode) {
      setQuizAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: selected,
      }));

      if (quizQueue.length <= 1) {
        setQuizQueue([]);
        setQuizFinished(true);
        setQuizStarted(false);
      } else {
        setQuizQueue((prev) => prev.slice(1));
      }

      return;
    }

    setChoice(selected);
    const isCorrect = selected === currentQuestion.correct_option;
    const correctLabel =
      currentQuestion.correct_option === "A"
        ? currentQuestion.option_a
        : currentQuestion.correct_option === "B"
          ? currentQuestion.option_b
          : currentQuestion.correct_option;

    setFeedback(isCorrect ? "Doğru, devam." : `Olmadı. Doğru cevap: ${correctLabel}`);
    setShowExplanation(true);
  }

  function skipQuizQuestion() {
    if (!isQuizMode || !currentQuestion) return;
    if (quizQueue.length <= 1) return;
    setQuizQueue((prev) => [...prev.slice(1), prev[0]]);
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

  function getModeLabel(mode: Exclude<SolveMode, null>) {
    if (mode === "classic") return "Klasik Mod";
    if (mode === "true-false") return "Doğru / Yanlış";
    return "Quiz";
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setPendingMode(null);
    setPendingHref(null);
  }

  function proceedModeChange() {
    if (!selectedMode) {
      closeConfirm();
      return;
    }

    if (pendingHref) {
      router.push(pendingHref);
    } else if (pendingMode) {
      router.replace(`/dashboard/solve?mode=${pendingMode}`);
    } else {
      router.replace("/dashboard/solve");
    }

    closeConfirm();
  }

  function handleModeAction(nextMode: Exclude<SolveMode, null>) {
    if (!selectedMode) {
      router.replace(`/dashboard/solve?mode=${nextMode}`);
      return;
    }

    if (selectedMode === nextMode) {
      setPendingMode(null);
      setPendingHref(null);
      setConfirmOpen(true);
      return;
    }

    setPendingMode(nextMode);
    setPendingHref(null);
    setConfirmOpen(true);
  }

  function handleNavigationAttempt(href: string) {
    if (!selectedMode) return true;
    if (href.startsWith("/dashboard/solve")) return true;

    setPendingHref(href);
    setPendingMode(null);
    setConfirmOpen(true);
    return false;
  }

  function startQuiz() {
    setQuizStarted(true);
    setQuizFinished(false);
    setQuizFinishOpen(false);
    setQuizAnswers({});
    setQuizReviewPage(1);
    setCurrentIndex(0);
    setQuizQueue(questions.map((question) => question.id));
    setChoice("");
    setFeedback("");
    setShowExplanation(false);
    setQuizSecondsLeft(40 * 60);
    setQuizStartOpen(false);
    openToast("Quiz başladı. Süre akıyor.");
  }

  function finishQuiz() {
    setQuizStarted(false);
    setQuizFinished(true);
    setQuizFinishOpen(false);
    setQuizQueue([]);
  }

  function renderQuestionCard(question: QuestionRow) {
    return (
      <div className="overflow-hidden rounded-[34px] border border-[color:color-mix(in_srgb,var(--primary)_28%,var(--border))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_92%,white),color-mix(in_srgb,var(--surface-strong)_72%,white))] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-7 sm:py-9">
        {(localQuestionImage || sharedQuestionImage) && (
          <div className="mb-5 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)]">
            <Image
              src={localQuestionImage || sharedQuestionImage || ""}
              alt="Soru görseli"
              width={1200}
              height={900}
              className="max-h-[18rem] w-full object-contain"
              unoptimized
            />
          </div>
        )}
        <h3 className="break-words text-2xl font-semibold leading-9 text-[var(--foreground)] sm:text-[2rem] sm:leading-10 [overflow-wrap:anywhere]">
          {question.question_text}
        </h3>
        {!isQuizMode ? (
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
            Hazırlayan: {question.created_by_name || "Bilinmiyor"}
          </p>
        ) : null}
      </div>
    );
  }

  function renderAnswerButtons(question: QuestionRow) {
    const options = isQuizMode
      ? (["A", "B", "C", "D"] as const)
      : visibleOptions;

    return (
      <div className={`grid gap-3 ${isTrueFalseMode ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => {
          const text = getAnswerText(question, option);
          const isSelected = choice === option;
          const isCorrect = choice && question.correct_option === option;
          const isWrongChoice = isSelected && question.correct_option !== option;

          let className =
            "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_97%,white)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]";

          if (!isQuizMode) {
            if (isCorrect) {
              className =
                "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200";
            } else if (isWrongChoice) {
              className =
                "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200";
            } else if (isSelected) {
              className =
                "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,var(--surface))] text-[var(--foreground)]";
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              className={`rounded-[22px] border px-4 py-3 text-left shadow-[var(--shadow-soft)] transition ${className}`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/6 text-sm font-semibold dark:bg-white/10">
                  {isTrueFalseMode ? (option === "A" ? "D" : "Y") : option}
                </span>
                <span className="break-words text-sm leading-6 [overflow-wrap:anywhere]">{text}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  function renderModeContent() {
    if (!selectedMode) {
      return (
        <section className="rounded-[30px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] p-5 text-sm text-[var(--foreground-muted)] shadow-[var(--shadow-soft)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Hazır</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Önce bir mod seç</h2>
          <p className="mt-2 leading-6">
            Klasik mod, doğru / yanlış ya da quiz içinden birini seçince soru akışı açılacak.
          </p>
        </section>
      );
    }

    if (isQuizMode) {
      if (!quizStarted && !quizFinished) {
        return (
          <section className="rounded-[30px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Quiz Modu</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">40 soru, 40 dakika</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Sorular tek tek gelecek. Cevap işaretlenince otomatik geçecek. Doğru cevap ve açıklama quiz bitene kadar görünmeyecek.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Soru Sayısı</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{questions.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Süre</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">40:00</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Kaynak</p>
                <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">Klasik Sorular</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setQuizStartOpen(true)}
              disabled={!questions.length}
              className="mt-5 min-h-12 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--surface)] shadow-[var(--shadow-soft)] disabled:opacity-60"
            >
              Başla
            </button>
          </section>
        );
      }

      if (quizFinished) {
        return (
          <section className="space-y-4 rounded-[30px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] p-5 shadow-[var(--shadow-soft)]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Quiz Sonucu</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Tur bitti</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Doğru</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-600">{quizStats.correct}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Yanlış</p>
                <p className="mt-2 text-2xl font-semibold text-rose-600">{quizStats.wrong}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Boş</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{quizStats.blank}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Cevaplanan</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{quizStats.answered}</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--primary)]">Cevaplar</p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">Soru ve cevap özeti</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setQuizStartOpen(true)}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  Tekrar Başlat
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {pagedQuizQuestions.map((question, index) => {
                  const selectedAnswer = quizAnswers[question.id];
                  const selectedLabel = selectedAnswer ? getAnswerText(question, selectedAnswer) : "Boş";
                  const correctLabel = getAnswerText(question, question.correct_option);
                  const isCorrect = selectedAnswer === question.correct_option;
                  const questionNumber = (quizReviewPage - 1) * QUIZ_REVIEW_PAGE_SIZE + index + 1;

                  return (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4"
                    >
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                        Soru {questionNumber}
                      </p>
                      <p className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
                        {question.question_text}
                      </p>
                      <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                        Senin cevabın:{" "}
                        <span className={isCorrect ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                          {selectedLabel}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Doğru cevap: <span className="font-semibold text-[var(--foreground)]">{correctLabel}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              {quizReviewPageCount > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setQuizReviewPage((prev) => Math.max(prev - 1, 1))}
                    disabled={quizReviewPage === 1}
                    className="min-h-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-50"
                  >
                    Önceki 20
                  </button>
                  <span className="text-sm font-medium text-[var(--foreground-muted)]">
                    Sayfa {quizReviewPage} / {quizReviewPageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuizReviewPage((prev) => Math.min(prev + 1, quizReviewPageCount))}
                    disabled={quizReviewPage === quizReviewPageCount}
                    className="min-h-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-50"
                  >
                    Sonraki 20
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        );
      }

      return (
        <section className="rounded-[34px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] p-5 shadow-[var(--shadow-strong)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Quiz Modu</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Süre akıyor</h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                {formatDuration(quizSecondsLeft)}
              </div>
            </div>
          </div>

          {currentQuestion ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--foreground-muted)]">
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 uppercase tracking-[0.16em]">
                  Kalan {quizQueue.length} / {questions.length}
                </span>
                <span className="font-medium text-[var(--foreground-muted)]">Cevaplanan {quizStats.answered}</span>
              </div>
              {renderQuestionCard(currentQuestion)}
              {renderAnswerButtons(currentQuestion)}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={skipQuizQuestion}
                  className="min-h-11 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-soft)]"
                >
                  Boş Geç
                </button>
                <button
                  type="button"
                  onClick={() => setQuizFinishOpen(true)}
                  className="min-h-11 flex-1 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-[var(--shadow-soft)] dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
                >
                  Testi Bitir
                </button>
              </div>
            </div>
          ) : null}
        </section>
      );
    }

    return (
      <section className="rounded-[34px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,white)] p-5 shadow-[var(--shadow-strong)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)]">
              {isClassicMode ? "Klasik Mod" : "Doğru / Yanlış"}
            </p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">
              {isClassicMode ? "Konu seç, başlayalım" : "İfadeleri hızlıca çöz"}
            </h2>
            <p className="text-sm text-[var(--foreground-muted)]">
              {isClassicMode
                ? "Sorular karışık geliyor. Her tur biraz daha doğal akıyor."
                : "Doğru / yanlış sorular kendi akışında karışık geliyor."}
            </p>
          </div>
          <Link
            href="/dashboard/add-question"
            onClick={(event) => {
              if (!handleNavigationAttempt("/dashboard/add-question")) {
                event.preventDefault();
              }
            }}
            className="inline-flex min-h-11 items-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-soft)] transition hover:bg-[var(--surface-muted)]"
          >
            Soru Ekle
          </Link>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-[var(--foreground)]">Konu seç</label>
          <select
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="mt-1 min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 shadow-[var(--shadow-soft)]"
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

        {loading ? (
          <div className="mt-6 grid gap-4">
            <div className="rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_92%,white),color-mix(in_srgb,var(--surface-strong)_72%,white))] px-6 py-8 shadow-[var(--shadow-soft)]">
              <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--surface-strong)]" />
              <div className="mt-5 h-8 w-full animate-pulse rounded-2xl bg-[color:color-mix(in_srgb,var(--surface-strong)_76%,white)]" />
              <div className="mt-3 h-8 w-4/5 animate-pulse rounded-2xl bg-[color:color-mix(in_srgb,var(--surface-strong)_76%,white)]" />
            </div>
            <div className="grid gap-3">
              {Array.from({ length: isTrueFalseMode ? 2 : 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-[var(--surface-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !topics.length ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
            Daha ortada aktif konu yok. Önce konu eklemek gerekiyor.
          </div>
        ) : !currentQuestion ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
            {isTrueFalseMode
              ? `${selectedTopicLabel} içinde henüz doğru / yanlış sorusu görünmüyor.`
              : `${selectedTopicLabel} tarafı şimdilik boş görünüyor.`}
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] shadow-[var(--shadow-soft)]"
                      aria-label="Önceki soru"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={nextQuestion}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] shadow-[var(--shadow-soft)]"
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

            {renderQuestionCard(currentQuestion)}
            {renderAnswerButtons(currentQuestion)}

            {feedback && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-[var(--shadow-soft)] ${
                  choice === currentQuestion.correct_option
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                    : "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
                }`}
              >
                {feedback}
              </div>
            )}

            {showExplanation && (
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--foreground-muted)] shadow-[var(--shadow-soft)]">
                <p className="font-semibold text-[var(--foreground)]">Kısa Açıklama</p>
                <p className="mt-1 break-words [overflow-wrap:anywhere]">
                  {currentQuestion.explanation?.trim() || "Bu soru için henüz ekstra not bırakılmamış."}
                </p>
              </div>
            )}

            {choice && (
              <button
                onClick={nextQuestion}
                className="min-h-12 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--surface)] shadow-[var(--shadow-soft)]"
              >
                Sonraki Soru
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar onNavigateAttempt={handleNavigationAttempt} />

      {confirmOpen && selectedMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-5 shadow-[var(--shadow-strong)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Onay</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              {getModeLabel(selectedMode)} modundan çıkılsın mı?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              {pendingHref
                ? "Bu sayfadan ayrılacaksın."
                : pendingMode
                  ? `${getModeLabel(pendingMode)} moduna geçeceksin.`
                  : "Şimdilik mod seçimi ekranına döneceksin."}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={closeConfirm}
                className="min-h-11 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={proceedModeChange}
                className="min-h-11 flex-1 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--surface)]"
              >
                Evet, çık
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {quizStartOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-5 shadow-[var(--shadow-strong)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Quiz Onayı</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Quiz başlasın mı?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Başlattığında sınav hemen aktif olur ve süre geri saymaya başlar. Bu mod deneme mantığında çalışır,
              o yüzden cevapları anında göstermeyiz.
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--primary)]">Kısa Bilgi</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground-muted)]">
                <li>Toplam 40 soru var ve süren 40 dakika.</li>
                <li>Cevap işaretlediğinde sistem otomatik olarak sonraki soruya geçer.</li>
                <li>Doğru cevaplar ve açıklamalar quiz bitene kadar görünmez.</li>
                <li>Boş bıraktığın sorular tekrar karşına gelir, istersen en sonda testi bitirebilirsin.</li>
                <li>Son 15 ve son 5 dakikada küçük bir süre uyarısı görürsün.</li>
              </ul>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--foreground-muted)]">
              Hazırsan başlat, değilsen şimdi çıkıp sonra dönebilirsin.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setQuizStartOpen(false)}
                className="min-h-11 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={startQuiz}
                className="min-h-11 flex-1 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--surface)]"
              >
                Evet, başlat
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {quizFinishOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-5 shadow-[var(--shadow-strong)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Quiz Onayı</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Testi bitirmek istiyor musun?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Boş kalan sorular boş olarak sayılacak. İstersen devam edip onları sonra cevaplayabilirsin.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setQuizFinishOpen(false)}
                className="min-h-11 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Devam Et
              </button>
              <button
                type="button"
                onClick={finishQuiz}
                className="min-h-11 flex-1 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--surface)]"
              >
                Testi Bitir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed right-4 top-20 z-40 flex w-full max-w-xs flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_94%,white)] px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-soft)]"
            >
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}

      <div className="p-4 sm:p-8">
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <section className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface)_97%,white),color-mix(in_srgb,var(--surface-muted)_86%,white))] p-5 shadow-[var(--shadow-strong)] sm:p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)]">Çözüm Modları</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
              Nasıl çalışmak istersin?
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
              Önce modu seç, sonra sana uygun akış açılsın.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => handleModeAction("classic")}
                className={`flex min-h-36 flex-col justify-center rounded-[24px] border p-4 text-center shadow-[var(--shadow-soft)] transition ${
                  isClassicMode
                    ? "border-[var(--border-strong)] bg-[var(--surface)]"
                    : "border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_92%,white),var(--surface-muted))] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">Klasik Mod</p>
                <h3 className="mt-2 text-base font-semibold text-[var(--foreground)] sm:text-lg">Soru Çöz</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  Mevcut çoktan seçmeli soru çöz akışı burada.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleModeAction("true-false")}
                className={`flex min-h-36 flex-col justify-center rounded-[24px] border p-4 text-center shadow-[var(--shadow-soft)] transition ${
                  isTrueFalseMode
                    ? "border-[var(--border-strong)] bg-[var(--surface)]"
                    : "border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_92%,white),var(--surface-muted))] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">Hızlı Mod</p>
                <h3 className="mt-2 text-base font-semibold text-[var(--foreground)] sm:text-lg">Doğru / Yanlış</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  Hızlı karar verip ilerlenen mod burada açılacak.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleModeAction("quiz")}
                className={`flex min-h-36 flex-col justify-center rounded-[24px] border p-4 text-center shadow-[var(--shadow-soft)] transition ${
                  isQuizMode
                    ? "border-[var(--border-strong)] bg-[var(--surface)]"
                    : "border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_92%,white),var(--surface-muted))] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">Quiz Modu</p>
                <h3 className="mt-2 text-base font-semibold text-[var(--foreground)] sm:text-lg">
                  40 Soru / 40 Dakika
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  Süreli tam deneme ekranı burada açılacak.
                </p>
              </button>
            </div>
          </section>

          {renderModeContent()}
        </div>
      </div>
    </main>
  );
}
