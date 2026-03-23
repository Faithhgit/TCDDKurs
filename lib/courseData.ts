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
    date: "24.03.2026",
    day: "Salı",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "25.03.2026",
    day: "Çarşamba",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "26.03.2026",
    day: "Perşembe",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "27.03.2026",
    day: "Cuma",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "30.03.2026",
    day: "Pazartesi",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "31.03.2026",
    day: "Salı",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "01.04.2026",
    day: "Çarşamba",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "02.04.2026",
    day: "Perşembe",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "03.04.2026",
    day: "Cuma",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "06.04.2026",
    day: "Pazartesi",
    lesson: "Çeken ve Çekilen Araçlar Bilgisi",
    instructor: "Olcay Becer",
  },
  {
    date: "09.04.2026",
    day: "Perşembe",
    lesson: "Çeken ve Çekilen Araç Motorları Bilgisi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "10.04.2026",
    day: "Cuma",
    lesson: "Çeken ve Çekilen Araç Motorları Bilgisi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "13.04.2026",
    day: "Pazartesi",
    lesson: "Çeken ve Çekilen Araç Motorları Bilgisi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "14.04.2026",
    day: "Salı",
    lesson: "Çeken ve Çekilen Araç Motorları Bilgisi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "15.04.2026",
    day: "Çarşamba",
    lesson: "Çeken ve Çekilen Araç Motorları Bilgisi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "16.04.2026",
    day: "Perşembe",
    lesson: "Çeken ve Çekilen Araç Motorları Bilgisi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "17.04.2026",
    day: "Cuma",
    lesson: "Çeken ve Çekilen Araç Motorları Bilgisi",
    instructor: "Hayrettin Yılmaz",
  },
  {
    date: "20.04.2026",
    day: "Pazartesi",
    lesson: "Çeken ve Çekilen Araç Elektrik Bilgisi",
    instructor: "Halil İbrahim Çağlak",
  },
  {
    date: "21.04.2026",
    day: "Salı",
    lesson: "Çeken ve Çekilen Araç Elektrik Bilgisi",
    instructor: "Halil İbrahim Çağlak",
  },
  {
    date: "22.04.2026",
    day: "Çarşamba",
    lesson: "Çeken ve Çekilen Araç Elektrik Bilgisi",
    instructor: "Halil İbrahim Çağlak",
  },
  {
    date: "23.04.2026",
    day: "Perşembe",
    lesson: "Çeken ve Çekilen Araç Elektrik Bilgisi",
    instructor: "Halil İbrahim Çağlak",
  },
  {
    date: "24.04.2026",
    day: "Cuma",
    lesson: "Çeken ve Çekilen Araç Elektrik Bilgisi",
    instructor: "Halil İbrahim Çağlak",
  },
  {
    date: "27.04.2026",
    day: "Pazartesi",
    lesson: "Çeken ve Çekilen Araç Elektrik Bilgisi",
    instructor: "Halil İbrahim Çağlak",
  },
  {
    date: "28.04.2026",
    day: "Salı",
    lesson: "Çeken ve Çekilen Araç Elektrik Bilgisi",
    instructor: "Halil İbrahim Çağlak",
  },
  {
    date: "04.05.2026",
    day: "Pazartesi",
    lesson: "Çeken ve Çekilen Araç Fren Bilgisi",
    instructor: "Nuri Kara",
  },
  {
    date: "05.05.2026",
    day: "Salı",
    lesson: "Çeken ve Çekilen Araç Fren Bilgisi",
    instructor: "Nuri Kara",
  },
  {
    date: "06.05.2026",
    day: "Çarşamba",
    lesson: "Çeken ve Çekilen Araç Fren Bilgisi",
    instructor: "Nuri Kara",
  },
  {
    date: "07.05.2026",
    day: "Perşembe",
    lesson: "Çeken ve Çekilen Araç Fren Bilgisi",
    instructor: "Nuri Kara",
  },
  {
    date: "08.05.2026",
    day: "Cuma",
    lesson: "Çeken ve Çekilen Araç Fren Bilgisi",
    instructor: "Nuri Kara",
  },
  {
    date: "11.05.2026",
    day: "Pazartesi",
    lesson: "Çeken ve Çekilen Araç Fren Bilgisi",
    instructor: "Nuri Kara",
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

export const lessonSlots: LessonSlot[] = [...generatedLessonSlots];
