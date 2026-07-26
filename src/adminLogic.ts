import {
  getCircularDependencyNodeIds,
  getTaskStatusSummary,
  type TaskEdge,
  type TaskNode,
} from "./taskLogic";

export type AdminBoardSummary = {
  taskCount: number;
  completedCount: number;
  pendingCount: number;
  blockedCount: number;
  readyCount: number;
  unlinkedCount: number;
  circularCount: number;
  dependencyCount: number;
};

export type AdminUserProfile = AdminBoardSummary & {
  uid: string;
  email: string;
  displayName: string;
  updatedAt: string;
};

type AdminProfileIdentity = {
  uid?: string | null;
  email?: string | null;
  displayName?: string | null;
};

function toNonNegativeNumber(value: unknown): number {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue) || nextValue < 0) {
    return 0;
  }

  return Math.round(nextValue);
}

export function buildAdminBoardSummary(
  nodes: TaskNode[] = [],
  edges: TaskEdge[] = []
): AdminBoardSummary {
  const statusSummary = getTaskStatusSummary(nodes, edges);
  const circularCount = getCircularDependencyNodeIds(nodes, edges).length;

  return {
    taskCount: statusSummary.total,
    completedCount: statusSummary.completed,
    pendingCount: statusSummary.pending,
    blockedCount: statusSummary.blocked,
    readyCount: statusSummary.ready,
    unlinkedCount: statusSummary.unlinked,
    circularCount,
    dependencyCount: edges.length,
  };
}

export function buildAdminUserProfile(
  identity: AdminProfileIdentity,
  nodes: TaskNode[] = [],
  edges: TaskEdge[] = [],
  now = new Date()
): AdminUserProfile {
  return {
    uid: String(identity.uid || ""),
    email: String(identity.email || ""),
    displayName: String(identity.displayName || ""),
    updatedAt: now.toISOString(),
    ...buildAdminBoardSummary(nodes, edges),
  };
}

export function normalizeAdminUserProfile(
  value: Partial<AdminUserProfile> | null | undefined,
  fallbackUid = ""
): AdminUserProfile {
  return {
    uid: String(value?.uid || fallbackUid || ""),
    email: String(value?.email || ""),
    displayName: String(value?.displayName || ""),
    updatedAt: String(value?.updatedAt || ""),
    taskCount: toNonNegativeNumber(value?.taskCount),
    completedCount: toNonNegativeNumber(value?.completedCount),
    pendingCount: toNonNegativeNumber(value?.pendingCount),
    blockedCount: toNonNegativeNumber(value?.blockedCount),
    readyCount: toNonNegativeNumber(value?.readyCount),
    unlinkedCount: toNonNegativeNumber(value?.unlinkedCount),
    circularCount: toNonNegativeNumber(value?.circularCount),
    dependencyCount: toNonNegativeNumber(value?.dependencyCount),
  };
}

export function matchesAdminUserSearch(profile: AdminUserProfile, query = ""): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    profile.displayName,
    profile.email,
    profile.uid,
  ]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function sortAdminUsers(
  profiles: AdminUserProfile[] = [],
  currentUserId = ""
): AdminUserProfile[] {
  return [...profiles].sort((left, right) => {
    const leftIssueScore = left.blockedCount + left.circularCount;
    const rightIssueScore = right.blockedCount + right.circularCount;
    if (rightIssueScore !== leftIssueScore) {
      return rightIssueScore - leftIssueScore;
    }

    if (right.taskCount !== left.taskCount) {
      return right.taskCount - left.taskCount;
    }

    const leftIsCurrentUser = left.uid === currentUserId ? 1 : 0;
    const rightIsCurrentUser = right.uid === currentUserId ? 1 : 0;
    if (leftIsCurrentUser !== rightIsCurrentUser) {
      return leftIsCurrentUser - rightIsCurrentUser;
    }

    const leftUpdatedAt = Date.parse(left.updatedAt || "");
    const rightUpdatedAt = Date.parse(right.updatedAt || "");
    const leftUpdatedValue = Number.isFinite(leftUpdatedAt) ? leftUpdatedAt : 0;
    const rightUpdatedValue = Number.isFinite(rightUpdatedAt) ? rightUpdatedAt : 0;
    if (rightUpdatedValue !== leftUpdatedValue) {
      return rightUpdatedValue - leftUpdatedValue;
    }

    const leftLabel = (left.displayName || left.email || left.uid).toLowerCase();
    const rightLabel = (right.displayName || right.email || right.uid).toLowerCase();
    return leftLabel.localeCompare(rightLabel, undefined, { numeric: true, sensitivity: "base" });
  });
}
