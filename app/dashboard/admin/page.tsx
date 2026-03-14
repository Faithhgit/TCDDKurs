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
import { fetchUsersForAdmin, updateUserForAdmin, type UserRow } from "@/lib/users";

type StatusFilter = "all" | QuestionStatus;
type TopicFilter = "all" | number;

const optionKeys = [
  { label: "A", key: "option_a" },
  { label: "B", key: "option_b" },
  { label: "C", key: "option_c" },
  { label: "D", key: "option_d" },
] as const;

const statusLabel = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
} as const;

function getQuestionStatusClass(status: QuestionStatus) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function getUserStatusClass(isActive: boolean) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-rose-200 bg-rose-50 text-rose-800";
}

function formatDate(value?: string | null) {
  if (!value) return "Bilinmiyor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bilinmiyor";
  return date.toLocaleDateString("tr-TR");
}

export default function AdminPage() {
  const router = useRouter();
  const [pending, setPending] = useState<QuestionRow[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuestionRow[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRow | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");

  async function refreshData() {
    const [topicsRes, pendingRes, allRes, usersRes] = await Promise.all([
      fetchTopics(true),
      fetchPendingQuestions(),
      fetchQuestionsForAdmin(),
      fetchUsersForAdmin(),
    ]);

    setTopics((topicsRes.data ?? []) as TopicRow[]);
    setPending((pendingRes.data ?? []) as QuestionRow[]);
    setAllQuestions((allRes.data ?? []) as QuestionRow[]);
    setUsers((usersRes.data ?? []) as UserRow[]);
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

  const topicMap = useMemo(() => new Map(topics.map((topic) => [topic.id, topic.title])), [topics]);

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

  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLocaleLowerCase("tr-TR");
    return users.filter((user) => {
      if (!query) return true;
      return (
        user.name.toLocaleLowerCase("tr-TR").includes(query) ||
        (user.email ?? "").toLocaleLowerCase("tr-TR").includes(query) ||
        user.id.toLocaleLowerCase("tr-TR").includes(query)
      );
    });
  }, [userSearchQuery, users]);

  async function changeStatus(id: number, status: "approved" | "rejected") {
    setMessage("");
    const { error } = await updateQuestionStatus(id, status);
    if (error) {
      setMessage(error.message || "Durum güncellenemedi.");
      return;
    }
    setMessage(status === "approved" ? "Soru onaylandı." : "Soru reddedildi.");
    await refreshData();
    setSelectedQuestion((current) => (current?.id === id ? { ...current, status } : current));
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Bu soruyu silmek istediğinize emin misiniz?")) return;
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
    const { error } = await updateQuestion(selectedQuestion.id, {
      topic_id: selectedQuestion.topic_id,
      question_text: selectedQuestion.question_text.trim(),
      option_a: selectedQuestion.option_a.trim(),
      option_b: selectedQuestion.option_b.trim(),
      option_c: selectedQuestion.option_c.trim(),
      option_d: selectedQuestion.option_d.trim(),
      correct_option: selectedQuestion.correct_option,
      explanation: selectedQuestion.explanation?.trim() || null,
      normalized_question_text: normalizeQuestionText(selectedQuestion.question_text),
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

  async function handleSaveUser() {
    if (!selectedUser) return;
    setSavingUser(true);
    const { error } = await updateUserForAdmin(selectedUser.id, {
      name: selectedUser.name.trim(),
      email: selectedUser.email?.trim() || null,
      role: selectedUser.role,
      is_active: selectedUser.is_active,
      admin_note: selectedUser.admin_note?.trim() || null,
    });
    setSavingUser(false);
    if (error) {
      setMessage(error.message || "Kullanıcı güncellenemedi. users tablosunda email/admin_note alanlarını kontrol edin.");
      return;
    }
    setMessage("Kullanıcı bilgileri güncellendi.");
    await refreshData();
  }

  async function handleToggleBan() {
    if (!selectedUser) return;
    const nextActive = !selectedUser.is_active;
    const { error } = await updateUserForAdmin(selectedUser.id, { is_active: nextActive });
    if (error) {
      setMessage(error.message || "Üye durumu güncellenemedi.");
      return;
    }
    setSelectedUser((current) => (current ? { ...current, is_active: nextActive } : current));
    setMessage(nextActive ? "Üye tekrar aktif edildi." : "Üye pasife alındı.");
    await refreshData();
  }

  if (loading) {
    return <div className="min-h-screen bg-[var(--background)] p-4">Yükleniyor...</div>;
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <AppNavbar />
        <div className="p-4 sm:p-8">
          <div className="mx-auto max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Yetkiniz yok</h1>
            <p className="mt-2 text-[var(--foreground-muted)]">Bu sayfayı sadece admin kullanıcılar görüntüleyebilir.</p>
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
                <p className="text-sm text-[var(--foreground-muted)]">Soruları yönet, üyeleri düzenle ve admin notu tut.</p>
              </div>
              <Link href="/dashboard/admin/topics" className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm">
                Konu Yönetimi
              </Link>
            </div>

            {message && <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground-muted)]">{message}</div>}

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"><p className="text-sm text-[var(--foreground-muted)]">Bekleyen Sorular</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{pending.length}</p></div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"><p className="text-sm text-[var(--foreground-muted)]">Toplam Sorular</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{allQuestions.length}</p></div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"><p className="text-sm text-[var(--foreground-muted)]">Toplam Üyeler</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{users.length}</p></div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"><p className="text-sm text-[var(--foreground-muted)]">Aktif Üyeler</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{users.filter((user) => user.is_active).length}</p></div>
            </div>

            <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Bekleyen Sorular ({pending.length})</h2>
              <div className="mt-3 space-y-3">
                {pending.length === 0 ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">Bekleyen soru yok.</div> : pending.map((question) => (
                  <div key={question.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{question.question_text}</p>
                        <p className="mt-1 text-xs text-[var(--foreground-muted)]">{question.created_by_name} • {topicMap.get(question.topic_id) ?? "Konu yok"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => { setSelectedQuestion(question); setSelectedUser(null); }} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold">Detay</button>
                        <button onClick={() => changeStatus(question.id, "approved")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Onayla</button>
                        <button onClick={() => changeStatus(question.id, "rejected")} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white">Reddet</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Tüm Sorular ({filteredQuestions.length})</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Soru veya hazırlayan ara" className="min-h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm" />
                <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value === "all" ? "all" : Number(e.target.value))} className="min-h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"><option value="all">Tüm konular</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="min-h-11 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm"><option value="all">Tüm durumlar</option><option value="pending">Beklemede</option><option value="approved">Onaylandı</option><option value="rejected">Reddedildi</option></select>
              </div>
              <div className="mt-3 space-y-3">
                {filteredQuestions.length === 0 ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">Bu filtrede soru bulunamadı.</div> : filteredQuestions.map((question) => (
                  <button key={question.id} type="button" onClick={() => { setSelectedQuestion(question); setSelectedUser(null); }} className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{question.question_text}</p>
                        <p className="mt-1 text-xs text-[var(--foreground-muted)]">{topicMap.get(question.topic_id) ?? "Konu yok"} • {question.created_by_name}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getQuestionStatusClass(question.status)}`}>{statusLabel[question.status]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Kullanıcılar ({filteredUsers.length})</h2>
              <div className="mt-3">
                <input value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} placeholder="Ad, e-posta veya kullanıcı id ile ara" className="min-h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm" />
              </div>
              <div className="mt-3 space-y-3">
                {filteredUsers.length === 0 ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">Kullanıcı bulunamadı.</div> : filteredUsers.map((user) => (
                  <button key={user.id} type="button" onClick={() => { setSelectedUser(user); setSelectedQuestion(null); }} className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{user.name}</p>
                        <p className="mt-1 break-all text-xs text-[var(--foreground-muted)]">{user.email || "E-posta bilgisi yok"} • {user.role === "admin" ? "Admin" : "Öğrenci"}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getUserStatusClass(user.is_active)}`}>{user.is_active ? "Aktif" : "Pasif"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </section>

          <aside className="w-full xl:max-w-xl">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
              {selectedUser ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Kullanıcı Detayı</h2>
                  <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Ad Soyad</label><input value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" /></div>
                  <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">E-posta</label><input value={selectedUser.email ?? ""} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Rol</label><select value={selectedUser.role} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as UserRow["role"] })} className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"><option value="student">Öğrenci</option><option value="admin">Admin</option></select></div>
                    <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Durum</label><div className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">{selectedUser.is_active ? "Aktif" : "Pasif / Banlı"}</div></div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Kullanıcı ID</label><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 break-all text-sm text-[var(--foreground-muted)]">{selectedUser.id}</div></div>
                    <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Kayıt Tarihi</label><div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground-muted)]">{formatDate(selectedUser.created_at)}</div></div>
                  </div>
                  <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Admin Notu</label><textarea value={selectedUser.admin_note ?? ""} onChange={(e) => setSelectedUser({ ...selectedUser, admin_note: e.target.value })} placeholder="Bu kullanıcı hakkında sadece admin tarafında görünen not ekleyin." className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3" /></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleSaveUser} disabled={savingUser} className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-70">{savingUser ? "Kaydediliyor..." : "Üyeyi Güncelle"}</button>
                    <button onClick={handleToggleBan} className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${selectedUser.is_active ? "bg-rose-600" : "bg-emerald-600"}`}>{selectedUser.is_active ? "Üyeyi Banla" : "Banı Kaldır"}</button>
                  </div>
                </div>
              ) : selectedQuestion ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Soru Detayı</h2>
                  <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Konu</label><select value={selectedQuestion.topic_id} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, topic_id: Number(e.target.value) })} className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4">{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></div>
                  <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Soru Metni</label><textarea value={selectedQuestion.question_text} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, question_text: e.target.value })} className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3" /></div>
                  {optionKeys.map((option) => <div key={option.key}><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">{option.label} Şıkkı</label><input value={selectedQuestion[option.key]} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, [option.key]: e.target.value })} className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" /></div>)}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Doğru Şık</label><select value={selectedQuestion.correct_option} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, correct_option: e.target.value as QuestionRow["correct_option"] })} className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
                    <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Durum</label><select value={selectedQuestion.status} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, status: e.target.value as QuestionStatus })} className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"><option value="pending">Beklemede</option><option value="approved">Onaylandı</option><option value="rejected">Reddedildi</option></select></div>
                  </div>
                  <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Hazırlayan</label><input value={selectedQuestion.created_by_name} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, created_by_name: e.target.value })} className="min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" /></div>
                  <div><label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Açıklama</label><textarea value={selectedQuestion.explanation ?? ""} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, explanation: e.target.value })} className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3" /></div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleSaveQuestion} disabled={saving} className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-70">{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</button>
                    <button onClick={() => changeStatus(selectedQuestion.id, "approved")} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Onayla</button>
                    <button onClick={() => changeStatus(selectedQuestion.id, "rejected")} className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white">Reddet</button>
                    <button onClick={() => handleDelete(selectedQuestion.id)} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Soruyu Sil</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Detay Paneli</h2>
                  <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">Soldaki listelerden bir soru veya kullanıcı seçin. Burada düzenleme, banlama ve admin notu işlemlerini yapabilirsiniz.</div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
