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

export type LeaderboardSourceProgress = {
  user_id: string;
  solved_once: boolean;
  solved_correctly_once: boolean;
};

export type LeaderboardSourceQuizAttempt = {
  user_id: string;
  correct_count: number;
  answered_count: number;
  status: string;
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  approvedCount: number;
  totalCount: number;
  rank: number;
  badge: "gold" | "silver" | "bronze" | null;
};

export type LeaderboardCategory = "approved" | "solved" | "correct" | "quiz";

export type RankedLeaderboardEntry = {
  userId: string;
  name: string;
  value: number;
  secondaryValue: number;
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

function filterAllowedUsers(users: LeaderboardSourceUser[], allowedNames?: string[]) {
  const allowedNameSet = allowedNames?.length
    ? new Set(allowedNames.map((item) => normalizePersonName(item)))
    : null;

  return users.filter((user) => {
    if (user.is_active === false) return false;
    if (!allowedNameSet) return true;
    return allowedNameSet.has(normalizePersonName(user.name));
  });
}

function withRank<T extends { name: string }>(
  items: Array<T & { value: number; secondaryValue: number }>
): Array<T & { value: number; secondaryValue: number; rank: number; badge: "gold" | "silver" | "bronze" | null }> {
  return items
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      if (b.secondaryValue !== a.secondaryValue) return b.secondaryValue - a.secondaryValue;
      return a.name.localeCompare(b.name, "tr");
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      badge: index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null,
    }));
}

export function buildQuestionLeaderboard(
  users: LeaderboardSourceUser[],
  questions: LeaderboardSourceQuestion[],
  allowedNames?: string[]
) {
  const studentUsers = filterAllowedUsers(users, allowedNames);

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

export function buildSolvedLeaderboard(
  users: LeaderboardSourceUser[],
  progressRows: LeaderboardSourceProgress[],
  allowedNames?: string[]
) {
  const eligibleUsers = filterAllowedUsers(users, allowedNames);
  const stats = new Map<string, { solved: number; correct: number }>();

  for (const row of progressRows) {
    const current = stats.get(row.user_id) ?? { solved: 0, correct: 0 };
    if (row.solved_once) current.solved += 1;
    if (row.solved_correctly_once) current.correct += 1;
    stats.set(row.user_id, current);
  }

  return withRank(
    eligibleUsers.map((user) => ({
      userId: user.id,
      name: user.name,
      value: stats.get(user.id)?.solved ?? 0,
      secondaryValue: stats.get(user.id)?.correct ?? 0,
    }))
  );
}

export function buildCorrectLeaderboard(
  users: LeaderboardSourceUser[],
  progressRows: LeaderboardSourceProgress[],
  allowedNames?: string[]
) {
  const eligibleUsers = filterAllowedUsers(users, allowedNames);
  const stats = new Map<string, { solved: number; correct: number }>();

  for (const row of progressRows) {
    const current = stats.get(row.user_id) ?? { solved: 0, correct: 0 };
    if (row.solved_once) current.solved += 1;
    if (row.solved_correctly_once) current.correct += 1;
    stats.set(row.user_id, current);
  }

  return withRank(
    eligibleUsers.map((user) => ({
      userId: user.id,
      name: user.name,
      value: stats.get(user.id)?.correct ?? 0,
      secondaryValue: stats.get(user.id)?.solved ?? 0,
    }))
  );
}

export function buildQuizLeaderboard(
  users: LeaderboardSourceUser[],
  quizAttempts: LeaderboardSourceQuizAttempt[],
  allowedNames?: string[]
) {
  const eligibleUsers = filterAllowedUsers(users, allowedNames);
  const stats = new Map<string, { correct: number; attempts: number }>();

  for (const row of quizAttempts) {
    if (!["completed", "expired"].includes(row.status)) continue;
    const current = stats.get(row.user_id) ?? { correct: 0, attempts: 0 };
    current.correct += row.correct_count;
    current.attempts += row.answered_count;
    stats.set(row.user_id, current);
  }

  return withRank(
    eligibleUsers.map((user) => ({
      userId: user.id,
      name: user.name,
      value: stats.get(user.id)?.correct ?? 0,
      secondaryValue: stats.get(user.id)?.attempts ?? 0,
    }))
  );
}
