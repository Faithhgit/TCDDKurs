export function normalizeQuestionText(text: string) {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .replace(/[“”«»‹›‘’`"'–—-]/g, "")
    .replace(/[.,!?;:()\[\]{}]/g, "")
    .trim();
}
