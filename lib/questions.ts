"use client";

import { supabase } from "./supabaseClient";

export type QuestionOption = "A" | "B" | "C" | "D";
export type QuestionStatus = "pending" | "approved" | "rejected";

export type TopicRow = {
  id: number;
  title: string;
  slug: string;
  is_active: boolean;
  created_at?: string;
};

export type QuestionRow = {
  id: number;
  topic_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: QuestionOption;
  explanation?: string | null;
  created_by_user_id: string;
  created_by_name: string;
  status: QuestionStatus;
  normalized_question_text: string;
  created_at?: string;
  updated_at?: string;
};

export async function fetchTopics(includeInactive = false) {
  let query = supabase.from("topics").select("*").order("title", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function fetchQuestionsByTopic(topicId?: number | null) {
  let query = supabase
    .from("questions")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (topicId) {
    query = query.eq("topic_id", topicId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function fetchPendingQuestions() {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function fetchQuestionsForAdmin(status?: QuestionStatus) {
  let query = supabase.from("questions").select("*").order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function fetchQuestionsByUser(userId: string) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, status")
    .eq("created_by_user_id", userId);

  return { data, error };
}

export async function insertQuestion(question: {
  topic_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: QuestionOption;
  explanation?: string | null;
  created_by_user_id: string;
  created_by_name: string;
  normalized_question_text: string;
}) {
  return await supabase.from("questions").insert([{ ...question, status: "pending" }]);
}

export async function updateQuestion(
  id: number,
  question: Partial<Pick<
    QuestionRow,
    | "topic_id"
    | "question_text"
    | "option_a"
    | "option_b"
    | "option_c"
    | "option_d"
    | "correct_option"
    | "explanation"
    | "created_by_name"
    | "normalized_question_text"
    | "status"
  >>
) {
  return await supabase.from("questions").update(question).eq("id", id);
}

export async function deleteQuestion(id: number) {
  return await supabase.from("questions").delete().eq("id", id);
}

export async function updateQuestionStatus(id: number, status: Exclude<QuestionStatus, "pending">) {
  return await supabase.from("questions").update({ status }).eq("id", id);
}

export async function addTopic(input: { title: string; slug: string }) {
  return await supabase.from("topics").insert([{ ...input }]);
}

export async function updateTopic(
  id: number,
  input: Partial<Pick<TopicRow, "title" | "slug" | "is_active">>
) {
  return await supabase.from("topics").update(input).eq("id", id);
}

export async function findDuplicateQuestion(normalizedText: string) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, question_text, status, topic_id")
    .eq("normalized_question_text", normalizedText)
    .limit(1);

  return { data, error };
}

export async function findSimilarQuestions(normalizedText: string, topicId?: number) {
  const searchSeed = normalizedText
    .split(" ")
    .filter((part) => part.length >= 4)
    .slice(0, 4);

  if (!searchSeed.length) {
    return { data: [], error: null };
  }

  let query = supabase
    .from("questions")
    .select("id, question_text, status, topic_id, created_by_name")
    .limit(20);

  if (topicId) {
    query = query.eq("topic_id", topicId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return { data: [], error };
  }

  const similar = data.filter((item) => {
    const itemText = String(item.question_text ?? "").toLocaleLowerCase("tr-TR");
    const matchedWords = searchSeed.filter((word) => itemText.includes(word)).length;
    return matchedWords >= Math.min(2, searchSeed.length);
  });

  return { data: similar.slice(0, 5), error: null };
}
