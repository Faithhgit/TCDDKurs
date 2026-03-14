import { supabase } from "./supabaseClient";

export const QUESTION_IMAGE_BUCKET = "question-images";

function hashText(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash >>> 0).toString(36);
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function createQuestionImagePath(normalizedQuestionText: string) {
  const safeText = normalizedQuestionText.trim();
  const slug = slugify(safeText) || "soru";
  const hash = hashText(safeText);

  return `questions/${hash}-${slug}`;
}

export function getQuestionImagePublicUrl(normalizedQuestionText: string) {
  const path = createQuestionImagePath(normalizedQuestionText);
  return supabase.storage.from(QUESTION_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
