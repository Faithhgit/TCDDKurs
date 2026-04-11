"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AppButton from "@/components/ui/AppButton";

import AppNavbar from "@/components/ui/AppNavbar";
import { getUserProfile } from "@/lib/auth";
import { authorizedFetch, getAccessToken } from "@/lib/clientApi";
import { fileToDataUrl } from "@/lib/localQuestionImages";
import { fetchTopics, findDuplicateQuestion, findSimilarQuestions, type TopicRow } from "@/lib/questions";
import { supabase } from "@/lib/supabaseClient";
import { normalizeQuestionText } from "@/utils/normalize";

type SimilarQuestion = {
  id: number;
  question_text: string;
  status: string;
  created_by_name?: string;
};

type QuestionType = "multiple_choice" | "true_false";

function getStatusLabel(status: string) {
  if (status === "approved") return "Onaylandı";
  if (status === "rejected") return "Reddedildi";
  if (status === "pending") return "Beklemede";
  return status;
}

async function uploadQuestionImage(normalizedQuestionText: string, file: File) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Oturum bulunamadı.");
  }

  const formData = new FormData();
  formData.append("normalizedQuestionText", normalizedQuestionText);
  formData.append("file", file);

  const response = await fetch("/api/question-images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(result?.error || "Görsel yüklenemedi.");
  }
}

export default function AddQuestionPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicId, setTopicId] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>("multiple_choice");
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D" | "">("");
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<"A" | "B" | "">("");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [canDirectPublish, setCanDirectPublish] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

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
      setCanDirectPublish(profileRes.data?.role === "admin" || profileRes.data?.role === "manager");

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

  function resetTypeSpecificFields(nextType: QuestionType) {
    if (nextType === "multiple_choice") {
      setTrueFalseAnswer("");
      return;
    }

    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!topicId || !question.trim()) {
      setError("Önce konuyu ve soru metnini doldur.");
      return;
    }

    if (normalizedQuestion.length < 10) {
      setError("Soru biraz kısa kaldı. Biraz daha açalım.");
      return;
    }

    const isMultipleChoice = questionType === "multiple_choice";

    if (isMultipleChoice) {
      if (
        !optionA.trim() ||
        !optionB.trim() ||
        !optionC.trim() ||
        !optionD.trim() ||
        !correctOption
      ) {
        setError("Çoktan seçmeli soru için tüm şıkları ve doğru cevabı girmen gerekiyor.");
        return;
      }
    } else if (!trueFalseAnswer) {
      setError("Bu ifade doğru mu yanlış mı, onu seçmen gerekiyor.");
      return;
    }

    setLoading(true);

    const dupe = await findDuplicateQuestion(normalizedQuestion);
    if (dupe.data && dupe.data.length > 0) {
      setLoading(false);
      setError("Bu soru sistemde zaten var gibi görünüyor. Başka bir soru deneyelim.");
      return;
    }

    const finalName = name || "Öğrenci";
    const payload = {
      topic_id: topicId,
      question_text: question.trim(),
      option_a: isMultipleChoice ? optionA.trim() : "Doğru",
      option_b: isMultipleChoice ? optionB.trim() : "Yanlış",
      option_c: isMultipleChoice ? optionC.trim() : "-",
      option_d: isMultipleChoice ? optionD.trim() : "-",
      correct_option: isMultipleChoice ? correctOption : trueFalseAnswer,
      explanation: explanation.trim() || null,
      created_by_user_id: userId,
      created_by_name: finalName,
      normalized_question_text: normalizedQuestion,
      status: canDirectPublish ? "approved" : "pending",
    };

    const insertResponse = await authorizedFetch("/api/questions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const insertResult = (await insertResponse.json().catch(() => null)) as { error?: string } | null;

    if (!insertResponse.ok) {
      setLoading(false);
      setError(insertResult?.error || "Soru eklerken ufak bir terslik oldu.");
      return;
    }

    let imageMessage = "";

    if (imageFile) {
      try {
        await uploadQuestionImage(normalizedQuestion, imageFile);
        imageMessage = " Görsel de eklendi.";
      } catch (imageError) {
        imageMessage =
          imageError instanceof Error
            ? ` Görsel yüklenemedi: ${imageError.message}`
            : " Görsel yüklenemedi.";
      }
    }

    setLoading(false);
    setSuccess(
      canDirectPublish
        ? `Soru kaydedildi, direkt yayına girdi.${imageMessage}`
        : `Soru kaydedildi. Admin bakınca yayına alınır.${imageMessage}`
    );

    setQuestion("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("");
    setTrueFalseAnswer("");
    setExplanation("");
    setImagePreview("");
    setImageFile(null);
    setSimilarQuestions([]);
  }

  async function handleImageChange(file: File | null) {
    setError("");

    if (!file) {
      setImagePreview("");
      setImageFile(null);
      return;
    }

    try {
      const nextImage = await fileToDataUrl(file);
      setImagePreview(nextImage);
      setImageFile(file);
    } catch (fileError) {
      setImagePreview("");
      setImageFile(null);
      setError(fileError instanceof Error ? fileError.message : "Görsel eklerken bir şey ters gitti.");
    }
  }

  function autoResizeTextarea(target: HTMLTextAreaElement) {
    target.style.height = "0px";
    target.style.height = `${target.scrollHeight}px`;
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-4 shadow-[var(--shadow-strong)] sm:p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Soru Ekle</p>
            <h1 className="mt-1.5 text-[22px] font-semibold text-[var(--foreground)]">Yeni soru bırak</h1>
            <p className="mt-1.5 text-sm leading-6 text-[var(--foreground-muted)]">
              Önce soru türünü seç, sonra form sadece gereken alanları göstersin.
            </p>
          </div>

          {pageLoading ? (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">
              Form açılıyor...
            </div>
          ) : !topics.length ? (
            <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              Şu an aktif konu yok. Önce konu eklemek gerekiyor.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 shadow-[var(--shadow-soft)]">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">1. Adım</p>
                <h2 className="mt-1.5 text-base font-semibold text-[var(--foreground)]">Soru türünü seç</h2>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionType("multiple_choice");
                      resetTypeSpecificFields("multiple_choice");
                    }}
                    className={`rounded-[18px] border px-3.5 py-3.5 text-left transition ${
                      questionType === "multiple_choice"
                        ? "border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"
                        : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">Çoktan Seçmeli</p>
                    <p className="mt-1 text-[13px] leading-5 text-[var(--foreground-muted)]">
                      Klasik 4 şıklı soru yapısı.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuestionType("true_false");
                      resetTypeSpecificFields("true_false");
                    }}
                    className={`rounded-[18px] border px-3.5 py-3.5 text-left transition ${
                      questionType === "true_false"
                        ? "border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"
                        : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">Doğru / Yanlış</p>
                    <p className="mt-1 text-[13px] leading-5 text-[var(--foreground-muted)]">
                      Kısa ifade, tek karar, daha hızlı akış.
                    </p>
                  </button>
                </div>
              </section>

              <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 shadow-[var(--shadow-soft)]">
                <div className="grid gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Konu</label>
                    <select
                      value={topicId}
                      onChange={(e) => setTopicId(Number(e.target.value))}
                      className="min-h-11 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4"
                    >
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                          {questionType === "multiple_choice" ? "Soru metni" : "Doğru / yanlış metni"}
                        </label>
                        <p className="text-xs leading-5 text-[var(--foreground-muted)]">
                          {questionType === "multiple_choice"
                            ? "Soruyu net ve tek anlamlı olacak şekilde yaz."
                            : "Bir ifade yaz. Kullanıcı bunun doğru mu yanlış mı olduğuna karar versin."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckSimilar}
                        disabled={checkingSimilar || normalizedQuestion.length < 12}
                        className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        {checkingSimilar ? "Bakılıyor..." : "Benzer sorulara bak"}
                      </button>
                    </div>

                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="mt-2.5 min-h-28 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                      placeholder={
                        questionType === "multiple_choice"
                          ? "Soruyu buraya yaz."
                          : "Örnek: Lokomotif bakımında günlük kontrol zorunludur."
                      }
                    />
                  </div>
                  <div className="rounded-[18px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,white),color-mix(in_srgb,var(--surface-muted)_90%,white))] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)]">Görsel</label>
                        <p className="text-xs leading-5 text-[var(--foreground-muted)]">İstersen ekleyebilirsin.</p>
                      </div>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setImageFile(null);
                          }}
                          className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground-muted)]"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                      <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[16px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-center transition hover:bg-[var(--surface-muted)]">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => void handleImageChange(e.target.files?.[0] ?? null)}
                          className="hidden"
                        />
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {imagePreview ? "Başka görsel seç" : "Görsel seç"}
                        </span>
                      </label>
                      <p className="text-xs leading-5 text-[var(--foreground-muted)]">2 MB altı dosya rahat çalışır.</p>
                    </div>

                    {imagePreview && (
                      <div className="mt-3 overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
                        <Image
                          src={imagePreview}
                          alt="Soru görsel önizlemesi"
                          width={1200}
                          height={720}
                          className="max-h-40 w-full object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {questionType === "multiple_choice" ? (
                <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">2. Adım</p>
                  <h2 className="mt-1.5 text-base font-semibold text-[var(--foreground)]">Şıkları gir</h2>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {(
                      [
                        { key: "A", value: optionA, setter: setOptionA },
                        { key: "B", value: optionB, setter: setOptionB },
                        { key: "C", value: optionC, setter: setOptionC },
                        { key: "D", value: optionD, setter: setOptionD },
                      ] as const
                    ).map((item) => {
                      const isSelected = correctOption === item.key;

                      return (
                        <div
                          key={item.key}
                          className={`relative rounded-[16px] border px-3 py-1.5 transition ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50 shadow-[var(--shadow-soft)] dark:bg-emerald-950/30"
                              : "border-[var(--border)] bg-[var(--surface)]"
                          }`}
                        >
                          {isSelected ? (
                            <span className="absolute right-3 top-2 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                              Seçildi
                            </span>
                          ) : null}
                          <textarea
                            value={item.value}
                            onChange={(e) => {
                              item.setter(e.target.value);
                              autoResizeTextarea(e.currentTarget);
                            }}
                            onInput={(e) => autoResizeTextarea(e.currentTarget)}
                            placeholder={`${item.key} şıkkı`}
                            rows={1}
                            className="min-h-7 w-full resize-none overflow-hidden bg-transparent pr-20 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-muted)]"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Doğru şık</label>
                    <select
                      value={correctOption}
                      onChange={(e) =>
                        setCorrectOption(e.target.value as "A" | "B" | "C" | "D" | "")
                      }
                      className="min-h-11 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4"
                    >
                      <option value="">Seç</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </section>
              ) : (
                <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 shadow-[var(--shadow-soft)]">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">2. Adım</p>
                  <h2 className="mt-1.5 text-base font-semibold text-[var(--foreground)]">Cevabı seç</h2>

                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setTrueFalseAnswer("A")}
                      className={`rounded-[18px] border px-3.5 py-3.5 text-left transition ${
                        trueFalseAnswer === "A"
                          ? "border-emerald-500 bg-emerald-50 shadow-[var(--shadow-soft)] dark:bg-emerald-950/30"
                          : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">Doğru</p>
                        {trueFalseAnswer === "A" ? (
                          <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                            Seçildi
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Kullanıcı bu ifadeyi doğru olarak işaretleyecek.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTrueFalseAnswer("B")}
                      className={`rounded-[18px] border px-3.5 py-3.5 text-left transition ${
                        trueFalseAnswer === "B"
                          ? "border-emerald-500 bg-emerald-50 shadow-[var(--shadow-soft)] dark:bg-emerald-950/30"
                          : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_86%,transparent)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--foreground)]">Yanlış</p>
                        {trueFalseAnswer === "B" ? (
                          <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                            Seçildi
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Kullanıcı bu ifadeyi yanlış olarak işaretleyecek.
                      </p>
                    </button>
                  </div>
                </section>
              )}

              <section className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 shadow-[var(--shadow-soft)]">
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Açıklama</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="min-h-20 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                  placeholder="İstersen kısa bir açıklama bırak."
                />
              </section>

              {similarQuestions.length > 0 && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="font-semibold">Buna benzeyen sorular olabilir.</p>
                  <ul className="mt-2 space-y-2">
                    {similarQuestions.map((item) => (
                      <li key={item.id} className="rounded-xl bg-white/70 px-3 py-2 dark:bg-black/10">
                        <p>{item.question_text}</p>
                        <p className="mt-1 text-xs opacity-80">
                          Durum: {getStatusLabel(item.status)}
                          {item.created_by_name ? ` · Hazırlayan: ${item.created_by_name}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="rounded-[18px] bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-[18px] bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {success}
                </div>
              )}

              <AppButton type="submit" loading={loading} loadingText="G?nderiliyor..." fullWidth>
                Soruyu G?nder
              </AppButton>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}



