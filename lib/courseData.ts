export const classGroup = {
  title: "2026 1. Grup",
  code: "50105329",
};

export const classRoster: ReadonlyArray<{ name: string; note?: string }> = [
  { name: "Mehmet Gökçek" },
  { name: "Mehmet Yakşi", note: "Sınıf Başkan Yardımcısı" },
  { name: "Fatih Çetinkaya" },
  { name: "Halil Çil" },
  { name: "Yasin Kuruçay" },
  { name: "Şevket Akyol" },
  { name: "Orhan Yeter" },
  { name: "Aykut Mutlu", note: "Sınıf Başkanı" },
  { name: "Muhammed Kaymak" },
  { name: "Ali Ulaş Akkaya" },
  { name: "Yusuf Kubat" },
  { name: "Melih Işık" },
  { name: "Cihad Deveci" },
  { name: "Alper Kaan Kara" },
  { name: "İbrahim Yaşar" },
  { name: "Alperen Ateş" },
  { name: "Salih Emre Sevgili" },
  { name: "Kadir Çoban" },
  { name: "Ömürhan Aktaş" },
  { name: "Abdülbaki Düzgün" },
  { name: "Emre Badar" },
];

export const lessonTimeline = [
  { label: "1. Ders", start: "08:30", end: "09:15", type: "lesson" as const },
  { label: "Ara", start: "09:15", end: "09:30", type: "break" as const },
  { label: "2. Ders", start: "09:30", end: "10:15", type: "lesson" as const },
  { label: "Ara", start: "10:15", end: "10:30", type: "break" as const },
  { label: "3. Ders", start: "10:30", end: "11:15", type: "lesson" as const },
  { label: "Ara", start: "11:15", end: "11:30", type: "break" as const },
  { label: "4. Ders", start: "11:30", end: "12:15", type: "lesson" as const },
  { label: "Öğle Arası", start: "12:15", end: "14:00", type: "lunch" as const },
  { label: "5. Ders", start: "14:00", end: "14:45", type: "lesson" as const },
  { label: "Ara", start: "14:45", end: "15:00", type: "break" as const },
  { label: "6. Ders", start: "15:00", end: "15:45", type: "lesson" as const },
];

export const dailyScheduleLabel = "08:30 - 15:45";
export const dailyBreakLabel = "45 dk ders • 15 dk mola • 12:15 - 14:00 öğle arası";

type DailyLessonDefinition = {
  date: string;
  day: string;
  lesson: string;
  instructor: string;
};

const dailyLessonDefinitions: DailyLessonDefinition[] = [
  {
    date: "23.02.2026",
    day: "Pazartesi",
    lesson: "İş Sağlığı ve Güvenliği, Çevre Koruma ve Kalite Yönetimi",
    instructor: "Yıldız Esen",
  },
  {
    date: "24.02.2026",
    day: "Salı",
    lesson: "İş Sağlığı ve Güvenliği, Çevre Koruma ve Kalite Yönetimi",
    instructor: "Yıldız Esen",
  },
  {
    date: "25.02.2026",
    day: "Çarşamba",
    lesson: "İş Sağlığı ve Güvenliği, Çevre Koruma ve Kalite Yönetimi",
    instructor: "Yıldız Esen",
  },
  {
    date: "26.02.2026",
    day: "Perşembe",
    lesson: "İş Sağlığı ve Güvenliği, Çevre Koruma ve Kalite Yönetimi",
    instructor: "Yıldız Esen",
  },
  {
    date: "27.02.2026",
    day: "Cuma",
    lesson: "İş Sağlığı ve Güvenliği, Çevre Koruma ve Kalite Yönetimi",
    instructor: "Yıldız Esen",
  },
  {
    date: "02.03.2026",
    day: "Pazartesi",
    lesson: "İş Sağlığı ve Güvenliği, Çevre Koruma ve Kalite Yönetimi",
    instructor: "Yıldız Esen",
  },
  {
    date: "03.03.2026",
    day: "Salı",
    lesson: "Stres ve Kriz Yönetimi",
    instructor: "Üzeyir Sırasöğüt",
  },
  {
    date: "04.03.2026",
    day: "Çarşamba",
    lesson: "Stres ve Kriz Yönetimi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "05.03.2026",
    day: "Perşembe",
    lesson: "Stres ve Kriz Yönetimi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "06.03.2026",
    day: "Cuma",
    lesson: "Demiryolu Altyapı ve Üst Yapısı",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "09.03.2026",
    day: "Pazartesi",
    lesson: "Demiryolu Altyapı ve Üst Yapısı",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "10.03.2026",
    day: "Salı",
    lesson: "Demiryolu Altyapı ve Üst Yapısı",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "11.03.2026",
    day: "Çarşamba",
    lesson: "Demiryolu Altyapı ve Üst Yapısı",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "12.03.2026",
    day: "Perşembe",
    lesson: "Demiryolu Altyapı ve Üst Yapısı",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "13.03.2026",
    day: "Cuma",
    lesson: "Demiryolu Altyapı ve Üst Yapısı",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "23.03.2026",
    day: "Pazartesi",
    lesson: "Demiryolu Altyapı ve Üst Yapısı",
    instructor: "Hayrettin Yılmaz",
  },
];

export type LessonSlot = {
  date: string;
  day: string;
  slotLabel: string;
  start: string;
  end: string;
  lesson: string;
  instructor: string;
  type: "lesson";
};

const generatedLessonSlots: LessonSlot[] = dailyLessonDefinitions.flatMap((day) =>
  lessonTimeline
    .filter((slot) => slot.type === "lesson")
    .map((slot) => ({
      date: day.date,
      day: day.day,
      slotLabel: slot.label,
      start: slot.start,
      end: slot.end,
      lesson: day.lesson,
      instructor: day.instructor,
      type: "lesson" as const,
    }))
);

/* TEST_SLOTS_REMOVED
  {
    date: "18.03.2026",
    day: "Çarşamba",
    slotLabel: "1. Ders",
    start: "08:30",
    end: "09:15",
    lesson: "Cer Sistemleri Giriş",
    instructor: "Yıldız Esen",
    type: "lesson",
  },
  {
    date: "18.03.2026",
    day: "Çarşamba",
    slotLabel: "2. Ders",
    start: "09:30",
    end: "10:15",
    lesson: "Cer Sistemleri Giriş",
    instructor: "Yıldız Esen",
    type: "lesson",
  },
  {
    date: "18.03.2026",
    day: "Çarşamba",
    slotLabel: "3. Ders",
    start: "10:30",
    end: "11:15",
    lesson: "Cer Sistemleri Giriş",
    instructor: "Yıldız Esen",
    type: "lesson",
  },
  {
    date: "18.03.2026",
    day: "Çarşamba",
    slotLabel: "4. Ders",
    start: "11:30",
    end: "12:15",
    lesson: "Fren Sistemleri",
    instructor: "Hayrettin Yılmaz",
    type: "lesson",
  },
  {
    date: "18.03.2026",
    day: "Çarşamba",
    slotLabel: "5. Ders",
    start: "14:00",
    end: "14:45",
    lesson: "Fren Sistemleri",
    instructor: "Hayrettin Yılmaz",
    type: "lesson",
  },
  {
    date: "18.03.2026",
    day: "Çarşamba",
    slotLabel: "6. Ders",
    start: "15:00",
    end: "15:45",
    lesson: "Arıza Tespiti Uygulama",
    instructor: "Üzeyir Sırasöğüt",
    type: "lesson",
  },
];

TEST_SLOTS_REMOVED */

export const lessonSlots: LessonSlot[] = [...generatedLessonSlots];
