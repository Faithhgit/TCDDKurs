"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import AppNavbar from "@/components/ui/AppNavbar";
import { getUserProfile } from "@/lib/auth";
import { type BugReportRow } from "@/lib/bugReports";
import { authorizedFetch } from "@/lib/clientApi";
import { type QuestionRow, type QuestionStatus, type TopicRow } from "@/lib/questions";
import { supabase } from "@/lib/supabaseClient";
import { type UserRole, type UserRow } from "@/lib/users";
import { normalizeQuestionText } from "@/utils/normalize";

type AdminTab = "questions" | "users" | "reports";
type StatusFilter = "all" | QuestionStatus;
type TopicFilter = "all" | number;
type StaffRole = "admin" | "manager";

type BootstrapPayload = {
  role: StaffRole;
  canManageUsers: boolean;
  canManageTopics: boolean;
  canManageReports: boolean;
  topics: TopicRow[];
  pending: QuestionRow[];
  allQuestions: QuestionRow[];
  users: UserRow[];
  bugReports: BugReportRow[];
};

const panelClass =
  "rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md";
const inputClass =
  "min-h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4";

const optionKeys = [
  { label: "A", key: "option_a" },
  { label: "B", key: "option_b" },
  { label: "C", key: "option_c" },
  { label: "D", key: "option_d" },
] as const;

function statusLabel(status: QuestionStatus) {
  if (status === "approved") return "Onaylandı";
  if (status === "rejected") return "Reddedildi";
  return "Beklemede";
}

function statusClass(status: QuestionStatus) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function roleLabel(role: UserRole) {
  if (role === "manager") return "Yönetici";
  if (role === "admin") return "Admin";
  return "Öğrenci";
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<AdminTab>("questions");
  const [role, setRole] = useState<StaffRole>("admin");
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canManageTopics, setCanManageTopics] = useState(false);
  const [canManageReports, setCanManageReports] = useState(false);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [pending, setPending] = useState<QuestionRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reports, setReports] = useState<BugReportRow[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRow | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  async function refreshData() {
    const response = await authorizedFetch("/api/admin/bootstrap", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 401 || response.status === 403) setUnauthorized(true);
      setMessage(result?.error || "Yönetim verileri yüklenemedi.");
      return;
    }

    const payload = (await response.json()) as BootstrapPayload;
    setRole(payload.role);
    setCanManageUsers(payload.canManageUsers);
    setCanManageTopics(payload.canManageTopics);
    setCanManageReports(payload.canManageReports);
    setTopics(payload.topics ?? []);
    setPending(payload.pending ?? []);
    setQuestions(payload.allQuestions ?? []);
    setUsers(payload.users ?? []);
    setReports(payload.bugReports ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      const profile = await getUserProfile(data.user.id);
      if (!profile.data || !["admin", "manager"].includes(profile.data.role)) {
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
    const search = query.trim().toLocaleLowerCase("tr-TR");
    return questions.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesTopic = topicFilter === "all" || item.topic_id === topicFilter;
      const matchesSearch =
        !search ||
        item.question_text.toLocaleLowerCase("tr-TR").includes(search) ||
        item.created_by_name.toLocaleLowerCase("tr-TR").includes(search);
      return matchesStatus && matchesTopic && matchesSearch;
    });
  }, [questions, query, statusFilter, topicFilter]);

  const filteredUsers = useMemo(() => {
    const search = userQuery.trim().toLocaleLowerCase("tr-TR");
    return users.filter((item) => {
      if (!search) return true;
      return (
        item.name.toLocaleLowerCase("tr-TR").includes(search) ||
        (item.email ?? "").toLocaleLowerCase("tr-TR").includes(search) ||
        item.id.toLocaleLowerCase("tr-TR").includes(search)
      );
    });
  }, [users, userQuery]);

  async function updateQuestionStatus(id: number, status: "approved" | "rejected") {
    const response = await authorizedFetch(`/api/admin/questions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Soru durumu güncellenemedi.");
      return;
    }

    setMessage(status === "approved" ? "Soru onaylandı." : "Soru reddedildi.");
    await refreshData();
  }

  async function saveQuestion() {
    if (!selectedQuestion || role !== "manager") return;

    setSavingQuestion(true);
    const response = await authorizedFetch(`/api/admin/questions/${selectedQuestion.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        topic_id: selectedQuestion.topic_id,
        question_text: selectedQuestion.question_text.trim(),
        option_a: selectedQuestion.option_a.trim(),
        option_b: selectedQuestion.option_b.trim(),
        option_c: selectedQuestion.option_c.trim(),
        option_d: selectedQuestion.option_d.trim(),
        correct_option: selectedQuestion.correct_option,
        explanation: selectedQuestion.explanation?.trim() || null,
        created_by_name: selectedQuestion.created_by_name.trim(),
        normalized_question_text: normalizeQuestionText(selectedQuestion.question_text),
        status: selectedQuestion.status,
      }),
    });
    setSavingQuestion(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Soru güncellenemedi.");
      return;
    }

    setMessage("Soru güncellendi.");
    await refreshData();
  }

  async function removeQuestion(id: number) {
    if (role !== "manager") return;
    if (!window.confirm("Bu soruyu silmek istediğine emin misin?")) return;

    const response = await authorizedFetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Soru silinemedi.");
      return;
    }

    setSelectedQuestion(null);
    setMessage("Soru silindi.");
    await refreshData();
  }

  async function saveUser(fullUpdate = false) {
    if (!selectedUser) return;

    const body = fullUpdate
      ? {
          name: selectedUser.name.trim(),
          email: selectedUser.email?.trim() || null,
          role: selectedUser.role,
          is_active: selectedUser.is_active,
          admin_note: selectedUser.admin_note?.trim() || null,
        }
      : {
          is_active: selectedUser.is_active,
        };

    setSavingUser(true);
    const response = await authorizedFetch(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setSavingUser(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Kullanıcı güncellenemedi.");
      return;
    }

    const result = (await response.json()) as { data?: UserRow };
    if (result.data) setSelectedUser(result.data);

    setMessage(fullUpdate ? "Kullanıcı bilgileri güncellendi." : "Ban durumu güncellendi.");
    await refreshData();
  }

  async function toggleUserBan() {
    if (!selectedUser) return;

    const nextActive = !selectedUser.is_active;
    setSavingUser(true);
    const response = await authorizedFetch(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: nextActive }),
    });
    setSavingUser(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Ban durumu güncellenemedi.");
      return;
    }

    setSelectedUser({ ...selectedUser, is_active: nextActive });
    setMessage("Ban durumu güncellendi.");
    await refreshData();
  }

  async function updateReport(id: number, status: "open" | "resolved") {
    const response = await authorizedFetch(`/api/admin/bug-reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Hata bildirimi güncellenemedi.");
      return;
    }
    setMessage(status === "resolved" ? "Hata çözüldü olarak işaretlendi." : "Hata tekrar açıldı.");
    await refreshData();
  }

  async function removeReport(id: number) {
    if (!window.confirm("Bu hata bildirimini silmek istediğine emin misin?")) return;
    const response = await authorizedFetch(`/api/admin/bug-reports/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Hata bildirimi silinemedi.");
      return;
    }
    setMessage("Hata bildirimi silindi.");
    await refreshData();
  }

  if (loading) {
    return <AppLoadingScreen eyebrow="Yönetim" title="Panel hazırlanıyor" description="Yetkilere göre ekran yerleşiyor." />;
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <AppNavbar />
        <div className="p-4 sm:p-8">
          <div className={`mx-auto max-w-2xl ${panelClass}`}>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Bu sayfa sana kapalı</h1>
            <p className="mt-2 text-[var(--foreground-muted)]">
              Burayı sadece admin veya yönetici hesapları görebilir.
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
        <div className="mx-auto flex max-w-7xl flex-col gap-5 xl:flex-row">
          <section className={`flex-1 ${panelClass}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">
                  {role === "manager" ? "Yönetici Paneli" : "Admin Paneli"}
                </p>
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                  {role === "manager" ? "Tam Yönetim" : "Soru ve Ban Yönetimi"}
                </h1>
                {role === "manager" && (
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Kullanıcı, soru, konu ve hata bildirimleri burada.
                  </p>
                )}
              </div>
              {canManageTopics && (
                <Link href="/dashboard/admin/topics" className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm">
                  Konu Yönetimi
                </Link>
              )}
            </div>

            {message && (
              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                {message}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className={panelClass}><p className="text-sm text-[var(--foreground-muted)]">Bekleyen</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{pending.length}</p></div>
              <div className={panelClass}><p className="text-sm text-[var(--foreground-muted)]">Toplam Soru</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{questions.length}</p></div>
              <div className={panelClass}><p className="text-sm text-[var(--foreground-muted)]">Üyeler</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{users.length}</p></div>
              <div className={panelClass}><p className="text-sm text-[var(--foreground-muted)]">Hata Bildirimi</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{canManageReports ? reports.length : "-"}</p></div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-2">
              <button type="button" onClick={() => { setTab("questions"); setSelectedUser(null); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "questions" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>Sorular</button>
              <button type="button" onClick={() => { setTab("users"); setSelectedQuestion(null); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "users" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>Kullanıcılar</button>
              {canManageReports && (
                <button type="button" onClick={() => { setTab("reports"); setSelectedQuestion(null); setSelectedUser(null); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "reports" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>Hata Bildirimleri</button>
              )}
            </div>

            {tab === "questions" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <h2 className="text-base font-semibold text-[var(--foreground)]">Bekleyen Sorular ({pending.length})</h2>
                  <div className="mt-3 space-y-3">
                    {pending.length === 0 ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">Bekleyen soru yok.</div> : pending.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <p className="text-sm font-medium text-[var(--foreground)]">{item.question_text}</p>
                        <p className="mt-1 text-xs text-[var(--foreground-muted)]">{item.created_by_name} • {topicMap.get(item.topic_id) ?? "Konu yok"}</p>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { setSelectedQuestion(item); setSelectedUser(null); }} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold">Detay</button>
                          <button onClick={() => updateQuestionStatus(item.id, "approved")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Onayla</button>
                          <button onClick={() => updateQuestionStatus(item.id, "rejected")} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white">Reddet</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Soru veya hazırlayan ara" className={inputClass} />
                    <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value === "all" ? "all" : Number(e.target.value))} className={inputClass}><option value="all">Tüm konular</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={inputClass}><option value="all">Tüm durumlar</option><option value="pending">Beklemede</option><option value="approved">Onaylandı</option><option value="rejected">Reddedildi</option></select>
                  </div>
                  <div className="mt-3 space-y-3">
                    {filteredQuestions.map((item) => (
                      <button key={item.id} type="button" onClick={() => { setSelectedQuestion(item); setSelectedUser(null); }} className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">{item.question_text}</p>
                            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{topicMap.get(item.topic_id) ?? "Konu yok"} • {item.created_by_name}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "users" && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Ad, e-posta veya kullanıcı id ile ara" className={inputClass} />
                <div className="mt-3 space-y-3">
                  {filteredUsers.map((item) => (
                    <button key={item.id} type="button" onClick={() => { setSelectedUser(item); setSelectedQuestion(null); }} className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">{item.name}</p>
                          <p className="mt-1 break-all text-xs text-[var(--foreground-muted)]">{item.email || "E-posta bilgisi yok"} • {roleLabel(item.role)}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${item.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{item.is_active ? "Aktif" : "Pasif"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "reports" && canManageReports && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 space-y-3">
                {reports.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{item.created_by_name}</p>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${item.status === "resolved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{item.status === "resolved" ? "Çözüldü" : "Açık"}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-muted)]">{item.message}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => updateReport(item.id, item.status === "resolved" ? "open" : "resolved")} className={`rounded-2xl px-4 py-2 text-xs font-semibold text-white ${item.status === "resolved" ? "bg-amber-500" : "bg-emerald-600"}`}>{item.status === "resolved" ? "Tekrar Aç" : "Çözüldü İşaretle"}</button>
                      <button onClick={() => removeReport(item.id)} className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white">Sil</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className={`w-full xl:max-w-xl ${panelClass}`}>
            {selectedUser ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Kullanıcı Detayı</h2>
                {canManageUsers ? (
                  <>
                    <input value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} className={inputClass} />
                    <input value={selectedUser.email ?? ""} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} className={inputClass} />
                    <select value={selectedUser.role} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })} className={inputClass}><option value="student">Öğrenci</option><option value="admin">Admin</option><option value="manager">Yönetici</option></select>
                    <textarea value={selectedUser.admin_note ?? ""} onChange={(e) => setSelectedUser({ ...selectedUser, admin_note: e.target.value })} placeholder="İç not" className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3" />
                    <div className="flex gap-2">
                      <button onClick={() => saveUser(true)} disabled={savingUser} className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-70">{savingUser ? "Kaydediliyor..." : "Bilgileri Kaydet"}</button>
                      <button onClick={() => setSelectedUser({ ...selectedUser, is_active: !selectedUser.is_active })} className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${selectedUser.is_active ? "bg-rose-600" : "bg-emerald-600"}`}>{selectedUser.is_active ? "Banla" : "Banı Kaldır"}</button>
                      <button onClick={() => saveUser(false)} disabled={savingUser} className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-semibold">Sadece Ban Durumunu Kaydet</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="font-medium text-[var(--foreground)]">{selectedUser.name}</p>
                      <p className="mt-1 break-all text-sm text-[var(--foreground-muted)]">{selectedUser.email || "E-posta bilgisi yok"}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">Rol: {roleLabel(selectedUser.role)}</p>
                    </div>
                    <button onClick={() => void toggleUserBan()} disabled={savingUser} className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-70 ${selectedUser.is_active ? "bg-rose-600" : "bg-emerald-600"}`}>{savingUser ? "Kaydediliyor..." : selectedUser.is_active ? "Üyeyi Banla" : "Banı Kaldır"}</button>
                  </>
                )}
              </div>
            ) : selectedQuestion ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Soru Detayı</h2>
                {role === "manager" ? (
                  <>
                    <select value={selectedQuestion.topic_id} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, topic_id: Number(e.target.value) })} className={inputClass}>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select>
                    <textarea value={selectedQuestion.question_text} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, question_text: e.target.value })} className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3" />
                    {optionKeys.map((option) => <input key={option.key} value={selectedQuestion[option.key]} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, [option.key]: e.target.value })} className={inputClass} placeholder={`${option.label} şıkkı`} />)}
                    <select value={selectedQuestion.correct_option} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, correct_option: e.target.value as QuestionRow["correct_option"] })} className={inputClass}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select>
                    <select value={selectedQuestion.status} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, status: e.target.value as QuestionStatus })} className={inputClass}><option value="pending">Beklemede</option><option value="approved">Onaylandı</option><option value="rejected">Reddedildi</option></select>
                    <input value={selectedQuestion.created_by_name} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, created_by_name: e.target.value })} className={inputClass} placeholder="Hazırlayan" />
                    <textarea value={selectedQuestion.explanation ?? ""} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, explanation: e.target.value })} className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3" placeholder="Açıklama" />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={saveQuestion} disabled={savingQuestion} className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-70">{savingQuestion ? "Kaydediliyor..." : "Kaydet"}</button>
                      <button onClick={() => updateQuestionStatus(selectedQuestion.id, "approved")} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Onayla</button>
                      <button onClick={() => updateQuestionStatus(selectedQuestion.id, "rejected")} className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white">Reddet</button>
                      <button onClick={() => removeQuestion(selectedQuestion.id)} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Soruyu Sil</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">Admin burada sadece soruyu inceleyip onaylar ya da reddeder. Düzenleme ve silme yöneticiye açık.</div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="text-sm font-medium text-[var(--foreground)]">{selectedQuestion.question_text}</p>
                      <p className="mt-2 text-xs text-[var(--foreground-muted)]">Hazırlayan: {selectedQuestion.created_by_name}</p>
                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">Konu: {topicMap.get(selectedQuestion.topic_id) ?? "Konu yok"}</p>
                    </div>
                    <div className="grid gap-2">
                      {optionKeys.map((option) => <div key={option.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"><span className="font-semibold">{option.label}:</span> {selectedQuestion[option.key]}</div>)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateQuestionStatus(selectedQuestion.id, "approved")} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Onayla</button>
                      <button onClick={() => updateQuestionStatus(selectedQuestion.id, "rejected")} className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white">Reddet</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Detay Paneli</h2>
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">Soldan bir soru ya da kullanıcı seç. Buradaki seçenekler role göre daralır.</div>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
