/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import AppLoadingScreen from "@/components/ui/AppLoadingScreen";
import AppNavbar from "@/components/ui/AppNavbar";
import { type AnnouncementRow } from "@/lib/announcements";
import { type BugReportRow } from "@/lib/bugReports";
import { authorizedFetch } from "@/lib/clientApi";
import { type QuestionRow, type QuestionStatus, type TopicRow } from "@/lib/questions";
import { supabase } from "@/lib/supabaseClient";
import { type UserRole, type UserRow } from "@/lib/users";
import { normalizeQuestionText } from "@/utils/normalize";

type AdminTab = "questions" | "users" | "announcements" | "reports" | "logs";
type StatusFilter = "all" | QuestionStatus;
type TopicFilter = "all" | number;
type StaffRole = "admin" | "manager";
type QuestionKindFilter = "multiple-choice" | "true-false";

type MetaPayload = {
  role: StaffRole;
  canManageUsers: boolean;
  canManageTopics: boolean;
  canManageReports: boolean;
  counts: { pending: number; questions: number; users: number; reports: number; announcements: number };
};

type QuestionsPayload = {
  topics: TopicRow[];
  pending: QuestionRow[];
  items: QuestionRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type UsersPayload = {
  items: UserRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type ReportsPayload = {
  items: BugReportRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type AuditLogRow = {
  id: number;
  actor_user_id: string;
  actor_name: string;
  actor_role: "admin" | "manager" | "student" | "unknown";
  action: string;
  target_type: string;
  target_id?: string | null;
  summary: string;
  created_at: string;
};

type LogsPayload = {
  items: AuditLogRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type AnnouncementsPayload = {
  items: AnnouncementRow[];
};

type ResetConfirmAction = "solve-history" | "audit-logs" | null;

const panelClass = "rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md";
const inputClass = "min-h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4";
const PAGE_SIZE = 10;

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

function isTrueFalseQuestion(question: Pick<QuestionRow, "option_a" | "option_b" | "option_c" | "option_d">) {
  return (
    question.option_a.trim().toLocaleLowerCase("tr-TR") === "doğru" &&
    question.option_b.trim().toLocaleLowerCase("tr-TR") === "yanlış" &&
    question.option_c.trim() === "-" &&
    question.option_d.trim() === "-"
  );
}

function roleLabel(role: UserRole) {
  if (role === "manager") return "Yönetici";
  if (role === "admin") return "Admin";
  return "Öğrenci";
}

function Pagination({
  page,
  hasMore,
  loading,
  onPrevious,
  onNext,
}: {
  page: number;
  hasMore: boolean;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={loading || page <= 1}
        className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        Önceki
      </button>
      <span className="text-sm text-[var(--foreground-muted)]">Sayfa {page}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={loading || !hasMore}
        className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        Sonraki
      </button>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<AdminTab>("questions");

  const [role, setRole] = useState<StaffRole>("admin");
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canManageTopics, setCanManageTopics] = useState(false);
  const [canManageReports, setCanManageReports] = useState(false);
  const [counts, setCounts] = useState({ pending: 0, questions: 0, users: 0, reports: 0, announcements: 0 });

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [pending, setPending] = useState<QuestionRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [questionHasMore, setQuestionHasMore] = useState(false);
  const [questionPage, setQuestionPage] = useState(1);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userHasMore, setUserHasMore] = useState(false);
  const [userPage, setUserPage] = useState(1);

  const [reports, setReports] = useState<BugReportRow[]>([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [reportHasMore, setReportHasMore] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementDescription, setAnnouncementDescription] = useState("");
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [editingAnnouncementTitle, setEditingAnnouncementTitle] = useState("");
  const [editingAnnouncementDescription, setEditingAnnouncementDescription] = useState("");
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logHasMore, setLogHasMore] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logQuery, setLogQuery] = useState("");
  const [logActorRole, setLogActorRole] = useState<"all" | "admin" | "manager">("all");
  const [logTargetType, setLogTargetType] = useState<"all" | "question" | "user" | "bug_report" | "announcement">("all");
  const [resettingSolveHistory, setResettingSolveHistory] = useState(false);
  const [resettingAuditLogs, setResettingAuditLogs] = useState(false);
  const [resetConfirmAction, setResetConfirmAction] = useState<ResetConfirmAction>(null);

  const [selectedQuestion, setSelectedQuestion] = useState<QuestionRow | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const [questionKind, setQuestionKind] = useState<QuestionKindFilter>("multiple-choice");
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const topicMap = useMemo(() => new Map(topics.map((topic) => [topic.id, topic.title])), [topics]);

  function handleTabChange(nextTab: AdminTab) {
    setTab(nextTab);
    setSelectedQuestion(null);
    setSelectedUser(null);

    if (nextTab === "questions") {
      setQuestionPage(1);
      return;
    }

    if (nextTab === "users") {
      setUserPage(1);
      return;
    }

    if (nextTab === "announcements") {
      return;
    }

    if (nextTab === "logs") {
      setLogPage(1);
      return;
    }

    setReportPage(1);
  }

  function handleQuestionKindChange(nextKind: QuestionKindFilter) {
    setQuestionKind(nextKind);
    setQuestionPage(1);
    setSelectedQuestion(null);
  }

  async function refreshMeta() {
    const response = await authorizedFetch("/api/admin/meta", { method: "GET", cache: "no-store" });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 401 || response.status === 403) setUnauthorized(true);
      setMessage(result?.error || "Yönetim verileri yüklenemedi.");
      return false;
    }

    const payload = (await response.json()) as MetaPayload;
    setRole(payload.role);
    setCanManageUsers(payload.canManageUsers);
    setCanManageTopics(payload.canManageTopics);
    setCanManageReports(payload.canManageReports);
    setCounts(payload.counts);
    return true;
  }

  async function loadQuestions() {
    setSectionLoading(true);
    const params = new URLSearchParams({
      page: String(questionPage),
      limit: String(PAGE_SIZE),
      status: statusFilter,
      topicId: String(topicFilter),
      questionType: questionKind,
      query,
    });
    const response = await authorizedFetch(`/api/admin/questions?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    setSectionLoading(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Sorular yüklenemedi.");
      return;
    }

    const payload = (await response.json()) as QuestionsPayload;
    setTopics(payload.topics ?? []);
    setPending(payload.pending ?? []);
    setQuestions(payload.items ?? []);
    setQuestionTotal(payload.total ?? 0);
    setQuestionHasMore(payload.hasMore);
  }

  async function loadUsers() {
    setSectionLoading(true);
    const params = new URLSearchParams({
      page: String(userPage),
      limit: String(PAGE_SIZE),
      query: userQuery,
    });
    const response = await authorizedFetch(`/api/admin/users?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    setSectionLoading(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Kullanıcılar yüklenemedi.");
      return;
    }

    const payload = (await response.json()) as UsersPayload;
    setUsers(payload.items ?? []);
    setUserTotal(payload.total ?? 0);
    setUserHasMore(payload.hasMore);
  }

  async function loadReports() {
    if (!canManageReports) return;
    setSectionLoading(true);
    const params = new URLSearchParams({
      page: String(reportPage),
      limit: String(PAGE_SIZE),
    });
    const response = await authorizedFetch(`/api/admin/reports?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    setSectionLoading(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Hata bildirimleri yüklenemedi.");
      return;
    }

    const payload = (await response.json()) as ReportsPayload;
    setReports(payload.items ?? []);
    setReportTotal(payload.total ?? 0);
    setReportHasMore(payload.hasMore);
  }

  async function loadAnnouncements() {
    setSectionLoading(true);
    const response = await authorizedFetch("/api/admin/announcements?limit=10", {
      method: "GET",
      cache: "no-store",
    });
    setSectionLoading(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Duyurular yüklenemedi.");
      return;
    }

    const payload = (await response.json()) as AnnouncementsPayload;
    setAnnouncements(payload.items ?? []);
  }

  async function loadLogs() {
    if (role !== "manager") return;
    setSectionLoading(true);
    const params = new URLSearchParams({
      page: String(logPage),
      limit: String(PAGE_SIZE),
      query: logQuery,
      actorRole: logActorRole,
      targetType: logTargetType,
    });
    const response = await authorizedFetch(`/api/admin/logs?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    setSectionLoading(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Log kayıtları yüklenemedi.");
      return;
    }

    const payload = (await response.json()) as LogsPayload;
    setLogs(payload.items ?? []);
    setLogTotal(payload.total ?? 0);
    setLogHasMore(payload.hasMore);
  }

  async function resetSolveHistory() {
    if (role !== "manager" || resettingSolveHistory) return;

    setResettingSolveHistory(true);
    const response = await authorizedFetch("/api/admin/logs/reset-solve-history", {
      method: "POST",
    });
    setResettingSolveHistory(false);

    const result = (await response.json().catch(() => null)) as
      | {
          error?: string;
          deleted?: {
            quiz_attempts?: number;
            question_attempts?: number;
            question_progress?: number;
          };
        }
      | null;

    if (!response.ok) {
      setMessage(result?.error || "Çözüm kayıtları temizlenemedi.");
      return;
    }

    setMessage(
      `Çözüm kayıtları temizlendi. Quiz: ${result?.deleted?.quiz_attempts ?? 0}, deneme: ${result?.deleted?.question_attempts ?? 0}, ilerleme: ${result?.deleted?.question_progress ?? 0}`
    );
    await loadLogs();
  }

  async function resetAuditLogs() {
    if (role !== "manager" || resettingAuditLogs) return;

    setResettingAuditLogs(true);
    const response = await authorizedFetch("/api/admin/logs/reset-audit-logs", {
      method: "POST",
    });
    setResettingAuditLogs(false);

    const result = (await response.json().catch(() => null)) as
      | {
          error?: string;
          deleted?: {
            audit_logs?: number;
          };
        }
      | null;

    if (!response.ok) {
      setMessage(result?.error || "Log kayıtları temizlenemedi.");
      return;
    }

    setMessage(`Log kayıtları temizlendi. Silinen log: ${result?.deleted?.audit_logs ?? 0}`);
    await loadLogs();
  }

  function openResetConfirm(action: Exclude<ResetConfirmAction, null>) {
    setResetConfirmAction(action);
  }

  function closeResetConfirm() {
    setResetConfirmAction(null);
  }

  async function confirmResetAction() {
    const action = resetConfirmAction;
    closeResetConfirm();

    if (action === "solve-history") {
      await resetSolveHistory();
      return;
    }

    if (action === "audit-logs") {
      await resetAuditLogs();
    }
  }

  async function refreshVisibleTab() {
    await refreshMeta();
    if (tab === "questions") return loadQuestions();
    if (tab === "users") return loadUsers();
    if (tab === "announcements") return loadAnnouncements();
    if (tab === "reports") return loadReports();
    if (tab === "logs") return loadLogs();
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth/login");
        return;
      }

      const metaOk = await refreshMeta();
      if (!metaOk) {
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    void load();
  }, [router]);

  useEffect(() => {
    if (loading || unauthorized || tab !== "questions") return;
    void loadQuestions();
  }, [loading, unauthorized, tab, questionPage, query, statusFilter, topicFilter, questionKind]);

  useEffect(() => {
    if (loading || unauthorized || tab !== "users") return;
    void loadUsers();
  }, [loading, unauthorized, tab, userPage, userQuery]);

  useEffect(() => {
    if (loading || unauthorized || tab !== "announcements") return;
    void loadAnnouncements();
  }, [loading, unauthorized, tab]);

  useEffect(() => {
    if (loading || unauthorized || tab !== "reports" || !canManageReports) return;
    void loadReports();
  }, [loading, unauthorized, tab, reportPage, canManageReports]);

  useEffect(() => {
    if (loading || unauthorized || tab !== "logs" || role !== "manager") return;
    void loadLogs();
  }, [loading, unauthorized, tab, logPage, logQuery, logActorRole, logTargetType, role]);

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
    await refreshVisibleTab();
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
    await refreshVisibleTab();
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
    await refreshVisibleTab();
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
          can_access_makinist_guide: selectedUser.can_access_makinist_guide === true,
          makinist_guide_message: selectedUser.makinist_guide_message?.trim() || null,
        }
      : { is_active: selectedUser.is_active };

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
    await refreshVisibleTab();
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
    await refreshVisibleTab();
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
    await refreshVisibleTab();
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
    await refreshVisibleTab();
  }

  async function createAnnouncement() {
    const title = announcementTitle.trim();
    const description = announcementDescription.trim();

    if (!title || !description) {
      setMessage("Duyuru başlığı ve açıklaması gerekli.");
      return;
    }

    setSavingAnnouncement(true);
    const response = await authorizedFetch("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    });
    setSavingAnnouncement(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Duyuru eklenemedi.");
      return;
    }

    setAnnouncementTitle("");
    setAnnouncementDescription("");
    setMessage("Duyuru eklendi.");
    await refreshVisibleTab();
  }

  function startAnnouncementEdit(item: AnnouncementRow) {
    setEditingAnnouncementId(item.id);
    setEditingAnnouncementTitle(item.title);
    setEditingAnnouncementDescription(item.description);
  }

  function cancelAnnouncementEdit() {
    setEditingAnnouncementId(null);
    setEditingAnnouncementTitle("");
    setEditingAnnouncementDescription("");
  }

  async function saveAnnouncementEdit(id: number) {
    const title = editingAnnouncementTitle.trim();
    const description = editingAnnouncementDescription.trim();

    if (!title || !description) {
      setMessage("Duyuru başlığı ve açıklaması gerekli.");
      return;
    }

    setSavingAnnouncement(true);
    const response = await authorizedFetch(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title, description }),
    });
    setSavingAnnouncement(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Duyuru güncellenemedi.");
      return;
    }

    cancelAnnouncementEdit();
    setMessage("Duyuru güncellendi.");
    await refreshVisibleTab();
  }

  async function removeAnnouncement(id: number) {
    if (!window.confirm("Bu duyuruyu silmek istediğine emin misin?")) return;

    const response = await authorizedFetch(`/api/admin/announcements/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error || "Duyuru silinemedi.");
      return;
    }

    if (editingAnnouncementId === id) {
      cancelAnnouncementEdit();
    }

    setMessage("Duyuru silindi.");
    await refreshVisibleTab();
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
      {resetConfirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white),var(--surface))] p-5 shadow-[var(--shadow-strong)]">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--primary)]">Onay</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              {resetConfirmAction === "solve-history"
                ? "Çözüm verileri temizlensin mi?"
                : "Log kayıtları temizlensin mi?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              {resetConfirmAction === "solve-history"
                ? "Soru denemeleri, soru ilerlemesi ve quiz kayıtları tablolarındaki test verileri silinecek."
                : "Audit log kayıtları silinecek. Bu işlem geri alınmaz."}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={closeResetConfirm}
                className="min-h-11 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => void confirmResetAction()}
                className="min-h-11 flex-1 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--surface)]"
              >
                Evet, temizle
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
              <div className={panelClass}><p className="text-sm text-[var(--foreground-muted)]">Bekleyen</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{counts.pending}</p></div>
              <div className={panelClass}><p className="text-sm text-[var(--foreground-muted)]">Toplam Soru</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{counts.questions}</p></div>
              <div className={panelClass}><p className="text-sm text-[var(--foreground-muted)]">Üyeler</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{counts.users}</p></div>
              <div className={panelClass}><p className="text-sm text-[var(--foreground-muted)]">Hata Bildirimi</p><p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{canManageReports ? counts.reports : "-"}</p></div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-2">
              <button type="button" onClick={() => handleTabChange("questions")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "questions" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>Sorular</button>
              <button type="button" onClick={() => handleTabChange("users")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "users" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>Kullanıcılar</button>
              <button type="button" onClick={() => handleTabChange("announcements")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "announcements" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>Duyurular</button>
              {canManageReports && (
                <button type="button" onClick={() => handleTabChange("reports")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "reports" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>Hata Bildirimleri</button>
              )}
              {role === "manager" && (
                <button type="button" onClick={() => handleTabChange("logs")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === "logs" ? "bg-[var(--surface)] text-[var(--foreground)]" : "text-[var(--foreground-muted)]"}`}>Loglar</button>
              )}
            </div>

            {tab === "questions" && (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-2">
                  <button
                    type="button"
                    onClick={() => handleQuestionKindChange("multiple-choice")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      questionKind === "multiple-choice"
                        ? "bg-[var(--surface)] text-[var(--foreground)]"
                        : "text-[var(--foreground-muted)]"
                    }`}
                  >
                    Çoktan Seçmeli
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuestionKindChange("true-false")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                      questionKind === "true-false"
                        ? "bg-[var(--surface)] text-[var(--foreground)]"
                        : "text-[var(--foreground-muted)]"
                    }`}
                  >
                    Doğru / Yanlış
                  </button>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <h2 className="text-base font-semibold text-[var(--foreground)]">
                    {questionKind === "true-false" ? "Bekleyen Doğru / Yanlış Soruları" : "Bekleyen Çoktan Seçmeli Sorular"} ({pending.length})
                  </h2>
                  <div className="mt-3 space-y-3">
                    {pending.length === 0 ? <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">Bekleyen soru yok.</div> : pending.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 text-left">
                            <p className="line-clamp-3 text-sm font-medium leading-6 text-[var(--foreground)]">{item.question_text}</p>
                            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{item.created_by_name} • {topicMap.get(item.topic_id) ?? "Konu yok"}</p>
                          </div>
                          <div className="flex w-[8.5rem] shrink-0 flex-col items-end gap-2">
                            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">
                              {isTrueFalseQuestion(item) ? "Doğru / Yanlış" : "Çoktan Seçmeli"}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusClass(item.status)}`}>
                              {statusLabel(item.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
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
                    <input value={query} onChange={(e) => { setQuery(e.target.value); setQuestionPage(1); }} placeholder="Soru veya hazırlayan ara" className={inputClass} />
                    <select value={topicFilter} onChange={(e) => { setTopicFilter(e.target.value === "all" ? "all" : Number(e.target.value)); setQuestionPage(1); }} className={inputClass}><option value="all">Tüm konular</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setQuestionPage(1); }} className={inputClass}><option value="all">Tüm durumlar</option><option value="pending">Beklemede</option><option value="approved">Onaylandı</option><option value="rejected">Reddedildi</option></select>
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                    {questionKind === "true-false" ? "Doğru / yanlış kayıtları listeleniyor." : "Çoktan seçmeli kayıtlar listeleniyor."}
                  </p>
                  <p className="mt-3 text-xs text-[var(--foreground-muted)]">Bu sayfada en fazla {PAGE_SIZE} soru gösteriliyor.</p>
                  <div className="mt-3 space-y-3">
                    {questions.map((item) => (
                      <button key={item.id} type="button" onClick={() => { setSelectedQuestion(item); setSelectedUser(null); }} className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 text-left">
                            <p className="line-clamp-3 text-sm font-medium leading-6 text-[var(--foreground)]">{item.question_text}</p>
                            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{topicMap.get(item.topic_id) ?? "Konu yok"} • {item.created_by_name}</p>
                          </div>
                          <div className="flex w-[11.5rem] shrink-0 flex-col items-end gap-2">
                            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">
                              {isTrueFalseQuestion(item) ? "Doğru / Yanlış" : "Çoktan Seçmeli"}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Pagination page={questionPage} hasMore={questionHasMore} loading={sectionLoading} onPrevious={() => setQuestionPage((current) => Math.max(1, current - 1))} onNext={() => setQuestionPage((current) => current + 1)} />
                  <p className="mt-2 text-xs text-[var(--foreground-muted)]">Toplam eşleşen kayıt: {questionTotal}</p>
                </div>
              </div>
            )}

            {tab === "users" && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <input value={userQuery} onChange={(e) => { setUserQuery(e.target.value); setUserPage(1); }} placeholder="Ad, e-posta veya kullanıcı id ile ara" className={inputClass} />
                <p className="mt-3 text-xs text-[var(--foreground-muted)]">Bu sayfada en fazla {PAGE_SIZE} kullanıcı gösteriliyor.</p>
                <div className="mt-3 space-y-3">
                  {users.map((item) => (
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
                <Pagination page={userPage} hasMore={userHasMore} loading={sectionLoading} onPrevious={() => setUserPage((current) => Math.max(1, current - 1))} onNext={() => setUserPage((current) => current + 1)} />
                <p className="mt-2 text-xs text-[var(--foreground-muted)]">Toplam eşleşen kullanıcı: {userTotal}</p>
              </div>
            )}

            {tab === "announcements" && (
              <div className="mt-5 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Duyuru başlığı"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={createAnnouncement}
                    disabled={savingAnnouncement}
                    className="min-h-11 rounded-2xl bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {savingAnnouncement ? "Ekleniyor..." : "Duyuru Ekle"}
                  </button>
                </div>
                <textarea
                  value={announcementDescription}
                  onChange={(e) => setAnnouncementDescription(e.target.value)}
                  placeholder="Duyuru açıklaması"
                  rows={4}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                />
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {editingAnnouncementId === item.id ? (
                            <div className="space-y-3">
                              <input
                                value={editingAnnouncementTitle}
                                onChange={(e) => setEditingAnnouncementTitle(e.target.value)}
                                className={inputClass}
                              />
                              <textarea
                                value={editingAnnouncementDescription}
                                onChange={(e) => setEditingAnnouncementDescription(e.target.value)}
                                rows={4}
                                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground-muted)]">{item.description}</p>
                            </>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">
                          {new Date(item.created_at).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {editingAnnouncementId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveAnnouncementEdit(item.id)}
                              disabled={savingAnnouncement}
                              className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              {savingAnnouncement ? "Kaydediliyor..." : "Kaydet"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelAnnouncementEdit}
                              className="rounded-2xl border border-[var(--border)] px-4 py-2 text-xs font-semibold"
                            >
                              Vazgeç
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startAnnouncementEdit(item)}
                              className="rounded-2xl border border-[var(--border)] px-4 py-2 text-xs font-semibold"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAnnouncement(item.id)}
                              className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white"
                            >
                              Sil
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground-muted)]">
                      Henüz duyuru yok.
                    </div>
                  )}
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
                <Pagination page={reportPage} hasMore={reportHasMore} loading={sectionLoading} onPrevious={() => setReportPage((current) => Math.max(1, current - 1))} onNext={() => setReportPage((current) => current + 1)} />
                <p className="mt-2 text-xs text-[var(--foreground-muted)]">Toplam hata bildirimi: {reportTotal}</p>
              </div>
            )}

            {tab === "logs" && role === "manager" && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
                        Test Temizliği
                      </p>
                      <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-100">
                        Soru denemeleri, soru ilerlemesi ve quiz kayıtları tablolarındaki test verilerini tek tuşla temizler.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:min-w-[14rem]">
                      <button
                        type="button"
                        onClick={() => openResetConfirm("solve-history")}
                        disabled={resettingSolveHistory}
                        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {resettingSolveHistory ? "Temizleniyor..." : "Çözüm Verilerini Temizle"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openResetConfirm("audit-logs")}
                        disabled={resettingAuditLogs}
                        className="rounded-2xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200"
                      >
                        {resettingAuditLogs ? "Temizleniyor..." : "Logları Temizle"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <input value={logQuery} onChange={(e) => { setLogQuery(e.target.value); setLogPage(1); }} placeholder="İşlem veya kişi ara" className={inputClass} />
                  <select value={logActorRole} onChange={(e) => { setLogActorRole(e.target.value as "all" | "admin" | "manager"); setLogPage(1); }} className={inputClass}>
                    <option value="all">Tüm roller</option>
                    <option value="manager">Yönetici</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={logTargetType} onChange={(e) => { setLogTargetType(e.target.value as "all" | "question" | "user" | "bug_report" | "announcement"); setLogPage(1); }} className={inputClass}>
                    <option value="all">Tüm hedefler</option>
                    <option value="question">Sorular</option>
                    <option value="user">Kullanıcılar</option>
                    <option value="bug_report">Hata Bildirimleri</option>
                    <option value="announcement">Duyurular</option>
                  </select>
                </div>
                <div className="mt-4 space-y-3">
                  {logs.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{item.actor_name}</p>
                          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                            {roleLabel(item.actor_role as UserRole)} • {new Date(item.created_at).toLocaleString("tr-TR")}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">{item.target_type}</span>
                          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">{item.action}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">{item.summary}</p>
                    </div>
                  ))}
                </div>
                <Pagination page={logPage} hasMore={logHasMore} loading={sectionLoading} onPrevious={() => setLogPage((current) => Math.max(1, current - 1))} onNext={() => setLogPage((current) => current + 1)} />
                <p className="mt-2 text-xs text-[var(--foreground-muted)]">Toplam log kaydı: {logTotal}</p>
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
                    <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)]">
                      <input
                        type="checkbox"
                        checked={selectedUser.can_access_makinist_guide === true}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            can_access_makinist_guide: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-[var(--border)]"
                      />
                      <span>Lokomotif Bilgi Rehberi erişimi açık</span>
                    </label>
                    <textarea
                      value={selectedUser.makinist_guide_message ?? ""}
                      onChange={(e) => setSelectedUser({ ...selectedUser, makinist_guide_message: e.target.value })}
                      placeholder="Erişim yoksa kullanıcıya gösterilecek mesaj"
                      className="min-h-28 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                    />
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
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Lokomotif rehberi erişimi: {selectedUser.can_access_makinist_guide ? "Açık" : "Kapalı"}
                      </p>
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
                    {isTrueFalseQuestion(selectedQuestion) ? (
                      <>
                        <input value={selectedQuestion.option_a} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, option_a: e.target.value })} className={inputClass} placeholder="Doğru metni" />
                        <input value={selectedQuestion.option_b} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, option_b: e.target.value })} className={inputClass} placeholder="Yanlış metni" />
                        <select value={selectedQuestion.correct_option} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, correct_option: e.target.value as QuestionRow["correct_option"] })} className={inputClass}><option value="A">Doğru</option><option value="B">Yanlış</option></select>
                      </>
                    ) : (
                      <>
                        {optionKeys.map((option) => <input key={option.key} value={selectedQuestion[option.key]} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, [option.key]: e.target.value })} className={inputClass} placeholder={`${option.label} şıkkı`} />)}
                        <select value={selectedQuestion.correct_option} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, correct_option: e.target.value as QuestionRow["correct_option"] })} className={inputClass}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select>
                      </>
                    )}
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
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <p className="text-sm font-medium text-[var(--foreground)]">{selectedQuestion.question_text}</p>
                      <p className="mt-2 text-xs text-[var(--foreground-muted)]">Hazırlayan: {selectedQuestion.created_by_name}</p>
                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">Konu: {topicMap.get(selectedQuestion.topic_id) ?? "Konu yok"}</p>
                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">Tür: {isTrueFalseQuestion(selectedQuestion) ? "Doğru / Yanlış" : "Çoktan Seçmeli"}</p>
                    </div>
                    <div className="grid gap-2">
                      {isTrueFalseQuestion(selectedQuestion) ? (
                        <>
                          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"><span className="font-semibold">Doğru:</span> {selectedQuestion.option_a}</div>
                          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"><span className="font-semibold">Yanlış:</span> {selectedQuestion.option_b}</div>
                        </>
                      ) : (
                        optionKeys.map((option) => <div key={option.key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"><span className="font-semibold">{option.label}:</span> {selectedQuestion[option.key]}</div>)
                      )}
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
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground-muted)]">Soldan bir soru ya da kullanıcı seç.</div>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
