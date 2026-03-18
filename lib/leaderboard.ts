export type LeaderboardSourceUser = {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
};

export type LeaderboardSourceQuestion = {
  created_by_user_id: string;
  status: "pending" | "approved" | "rejected";
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  approvedCount: number;
  totalCount: number;
  rank: number;
  badge: "gold" | "silver" | "bronze" | null;
};

export function normalizePersonName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9çğıöşü\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildQuestionLeaderboard(
  users: LeaderboardSourceUser[],
  questions: LeaderboardSourceQuestion[],
  allowedNames?: string[]
) {
  const allowedNameSet = allowedNames?.length
    ? new Set(allowedNames.map((item) => normalizePersonName(item)))
    : null;

  const studentUsers = users.filter((user) => {
    if (user.is_active === false) return false;
    if (!allowedNameSet) return true;
    return allowedNameSet.has(normalizePersonName(user.name));
  });

  const questionStats = new Map<string, { approvedCount: number; totalCount: number }>();

  for (const question of questions) {
    const current = questionStats.get(question.created_by_user_id) ?? {
      approvedCount: 0,
      totalCount: 0,
    };

    current.totalCount += 1;
    if (question.status === "approved") {
      current.approvedCount += 1;
    }

    questionStats.set(question.created_by_user_id, current);
  }

  return studentUsers
    .map((user) => {
      const stats = questionStats.get(user.id) ?? { approvedCount: 0, totalCount: 0 };
      return {
        userId: user.id,
        name: user.name,
        approvedCount: stats.approvedCount,
        totalCount: stats.totalCount,
      };
    })
    .sort((a, b) => {
      if (b.approvedCount !== a.approvedCount) return b.approvedCount - a.approvedCount;
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.name.localeCompare(b.name, "tr");
    })
    .map<LeaderboardEntry>((entry, index) => ({
      ...entry,
      rank: index + 1,
      badge: index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null,
    }));
}
