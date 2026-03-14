"use client";

const STORAGE_KEY = "local_question_images";
const MAX_IMAGE_SIZE_BYTES = 500 * 1024;

type ImageStore = Record<string, string>;

function readStore(): ImageStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as ImageStore;
  } catch {
    return {};
  }
}

function writeStore(store: ImageStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getLocalQuestionImage(normalizedQuestionText: string) {
  return readStore()[normalizedQuestionText] ?? null;
}

export function saveLocalQuestionImage(normalizedQuestionText: string, dataUrl: string) {
  const store = readStore();
  store[normalizedQuestionText] = dataUrl;
  writeStore(store);
}

export function removeLocalQuestionImage(normalizedQuestionText: string) {
  const store = readStore();
  delete store[normalizedQuestionText];
  writeStore(store);
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      reject(new Error("Görsel en fazla 500 KB olabilir."));
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("Lütfen geçerli bir görsel dosyası seçin."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Görsel okunamadı."));
    reader.readAsDataURL(file);
  });
}

