"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

import AppNavbar from "@/components/ui/AppNavbar";
import { getUserProfile } from "@/lib/auth";
import { getAccessToken } from "@/lib/clientApi";
import { fileToDataUrl } from "@/lib/localQuestionImages";
import {
  fetchTopics,
  findDuplicateQuestion,
  findSimilarQuestions,
  insertQuestion,
  type TopicRow,
} from "@/lib/questions";
import { supabase } from "@/lib/supabaseClient";
import { normalizeQuestionText } from "@/utils/normalize";

type SimilarQuestion = {
  id: number;
  question_text: string;
  status: string;
  created_by_name?: string;
};

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
      setCanDirectPublish(
        profileRes.data?.role === "admin" || profileRes.data?.role === "manager"
      );

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
      setError("Boş yer kalmış. Hepsini doldurup doğru şıkkı seç.");
      return;
    }

    if (normalizedQuestion.length < 10) {
      setError("Soru biraz fazla kısa kaldı. Biraz daha aç.");
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
    const { error: insertError } = await insertQuestion({
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
      status: canDirectPublish ? "approved" : "pending",
    });

    if (insertError) {
      setLoading(false);
      setError(insertError.message || "Soru eklerken ufak bir terslik oldu.");
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

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--primary)]">Soru Ekle</p>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Yeni Soru Bırak</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              {canDirectPublish ? "Yönetim hesabındaysan soru direkt yayına girebilir." : "Soruyu bırak, admin bakınca yayına alır."}
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
                  placeholder="Soruyu net şekilde yaz."
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Aynı sorunun tekrar düşmemesi için metin kontrol ediliyor.
                  </p>
                  <button
                    type="button"
                    onClick={handleCheckSimilar}
                    disabled={checkingSimilar || normalizedQuestion.length < 12}
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {checkingSimilar ? "Bakılıyor..." : "Benzer Sorulara Bak"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={optionA} onChange={(e) => setOptionA(e.target.value)} placeholder="A şıkkı" className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" />
                <input value={optionB} onChange={(e) => setOptionB(e.target.value)} placeholder="B şıkkı" className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" />
                <input value={optionC} onChange={(e) => setOptionC(e.target.value)} placeholder="C şıkkı" className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" />
                <input value={optionD} onChange={(e) => setOptionD(e.target.value)} placeholder="D şıkkı" className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" />
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
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Açıklama</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                  placeholder="İstersen kısa bir açıklama bırak."
                />
              </div>

              <div className="rounded-[26px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,white),color-mix(in_srgb,var(--surface-muted)_90%,white))] p-4 shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Görsel Ekle</label>
                    <p className="text-xs leading-5 text-[var(--foreground-muted)]">
                      İstersen soruya tek bir görsel ekleyebilirsin. Soru kaydolunca diğer kullanıcılar da görür.
                    </p>
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
                      Görseli Kaldır
                    </button>
                  )}
                </div>

                <label className="mt-3 flex min-h-28 cursor-pointer items-center justify-center rounded-[22px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-4 py-5 text-center transition hover:bg-[var(--surface-muted)]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleImageChange(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {imagePreview ? "Başka bir görsel seç" : "Görsel seçmek için dokun"}
                  </span>
                </label>

                <p className="mt-2 text-xs leading-5 text-[var(--foreground-muted)]">
                  Çok büyük dosya koyma. 2 MB altı rahat çalışır.
                </p>

                {imagePreview && (
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
                    <Image
                      src={imagePreview}
                      alt="Soru görsel önizlemesi"
                      width={1200}
                      height={720}
                      className="max-h-56 w-full object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              {similarQuestions.length > 0 && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="font-semibold">Buna benzeyen sorular olabilir.</p>
                  <ul className="mt-2 space-y-2">
                    {similarQuestions.map((item) => (
                      <li key={item.id} className="rounded-xl bg-white/70 px-3 py-2 dark:bg-black/10">
                        <p>{item.question_text}</p>
                        <p className="mt-1 text-xs opacity-80">
                          Durum: {getStatusLabel(item.status)}
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
