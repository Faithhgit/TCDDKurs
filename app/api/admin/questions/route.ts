import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const PENDING_PREVIEW_LIMIT = 8;

function isTrueFalseQuestion(question: {
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
}) {
  return (
    question.option_a?.trim().toLocaleLowerCase("tr-TR") === "doğru" &&
    question.option_b?.trim().toLocaleLowerCase("tr-TR") === "yanlış" &&
    question.option_c?.trim() === "-" &&
    question.option_d?.trim() === "-"
  );
}

function getPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = getPositiveInt(searchParams.get("page"), 1);
  const limit = Math.min(getPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
  const query = searchParams.get("query")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "all";
  const questionType = searchParams.get("questionType")?.trim() ?? "multiple-choice";
  const topicIdValue = searchParams.get("topicId")?.trim() ?? "all";
  const topicId = topicIdValue !== "all" ? Number(topicIdValue) : null;

  let listQuery = supabaseAdmin.from("questions").select("*").order("created_at", { ascending: false });
  let pendingQuery = supabaseAdmin
    .from("questions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (status !== "all" && ["pending", "approved", "rejected"].includes(status)) {
    listQuery = listQuery.eq("status", status);
  }

  if (topicId && Number.isFinite(topicId)) {
    listQuery = listQuery.eq("topic_id", topicId);
    pendingQuery = pendingQuery.eq("topic_id", topicId);
  }

  if (query) {
    const search = `%${query}%`;
    listQuery = listQuery.or(`question_text.ilike.${search},created_by_name.ilike.${search}`);
  }

  const [topicsRes, pendingRes, itemsRes] = await Promise.all([
    supabaseAdmin.from("topics").select("*").order("title", { ascending: true }),
    pendingQuery,
    listQuery,
  ]);

  const error = topicsRes.error ?? pendingRes.error ?? itemsRes.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filterByType = (items: Record<string, unknown>[]) =>
    items.filter((item) =>
      questionType === "true-false"
        ? isTrueFalseQuestion(item)
        : !isTrueFalseQuestion(item)
    );

  const allFilteredItems = filterByType((itemsRes.data ?? []) as Record<string, unknown>[]);
  const filteredPendingItems = filterByType((pendingRes.data ?? []) as Record<string, unknown>[]);
  const from = (page - 1) * limit;
  const pagedItems = allFilteredItems.slice(from, from + limit);
  const total = allFilteredItems.length;

  return NextResponse.json({
    topics: topicsRes.data ?? [],
    pending: filteredPendingItems.slice(0, PENDING_PREVIEW_LIMIT),
    items: pagedItems,
    total,
    page,
    limit,
    hasMore: from + limit < total,
  });
}
