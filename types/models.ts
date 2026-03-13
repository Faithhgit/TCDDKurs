export type UserRole = "student" | "admin";

export interface Topic {
  id: number;
  title: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface Question {
  id: number;
  topicId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation?: string;
  createdByUserId: string;
  createdByName: string;
  status: "pending" | "approved" | "rejected";
  normalizedQuestionText: string;
  createdAt: string;
  updatedAt?: string;
}
