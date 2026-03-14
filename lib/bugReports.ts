"use client";

import { supabase } from "./supabaseClient";

export type BugReportRow = {
  id: number;
  message: string;
  created_by_user_id: string;
  created_by_name: string;
  status?: "open" | "resolved" | null;
  created_at?: string | null;
};

export async function createBugReport(input: {
  message: string;
  created_by_user_id: string;
  created_by_name: string;
}) {
  const { data, error } = await supabase
    .from("bug_reports")
    .insert([
      {
        message: input.message.trim(),
        created_by_user_id: input.created_by_user_id,
        created_by_name: input.created_by_name.trim(),
        status: "open",
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function fetchBugReports() {
  const { data, error } = await supabase
    .from("bug_reports")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function updateBugReportStatus(id: number, status: "open" | "resolved") {
  const { data, error } = await supabase
    .from("bug_reports")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteBugReport(id: number) {
  const { error } = await supabase.from("bug_reports").delete().eq("id", id);
  return { error };
}
