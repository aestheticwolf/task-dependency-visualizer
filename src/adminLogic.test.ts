import {
  buildAdminBoardSummary,
  buildAdminUserProfile,
  matchesAdminUserSearch,
  normalizeAdminUserProfile,
  sortAdminUsers,
} from "./adminLogic";

const nodes = [
  { id: "1", data: { label: "Design", completed: true } },
  { id: "2", data: { label: "QA", completed: false } },
  { id: "3", data: { label: "Deploy", completed: false } },
  { id: "4", data: { label: "Review", completed: false } },
];

const edges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-2", source: "3", target: "2" },
];

test("builds admin board summaries with dependency and cycle counts", () => {
  expect(buildAdminBoardSummary(nodes, edges)).toEqual({
    taskCount: 4,
    completedCount: 1,
    pendingCount: 3,
    blockedCount: 2,
    readyCount: 0,
    unlinkedCount: 1,
    circularCount: 2,
    dependencyCount: 3,
  });
});

test("builds admin user profiles from identity and board data", () => {
  const profile = buildAdminUserProfile(
    {
      uid: "richard",
      email: "richard@example.com",
      displayName: "Richard",
    },
    nodes,
    edges,
    new Date("2026-05-11T10:00:00.000Z")
  );

  expect(profile).toEqual({
    uid: "richard",
    email: "richard@example.com",
    displayName: "Richard",
    updatedAt: "2026-05-11T10:00:00.000Z",
    taskCount: 4,
    completedCount: 1,
    pendingCount: 3,
    blockedCount: 2,
    readyCount: 0,
    unlinkedCount: 1,
    circularCount: 2,
    dependencyCount: 3,
  });
});

test("normalizes partially populated admin user profiles", () => {
  expect(
    normalizeAdminUserProfile(
      {
        email: "qa@example.com",
        blockedCount: -10,
        taskCount: 7.4,
      },
      "qa-user"
    )
  ).toEqual({
    uid: "qa-user",
    email: "qa@example.com",
    displayName: "",
    updatedAt: "",
    taskCount: 7,
    completedCount: 0,
    pendingCount: 0,
    blockedCount: 0,
    readyCount: 0,
    unlinkedCount: 0,
    circularCount: 0,
    dependencyCount: 0,
  });
});

test("matches admin users by display name, email, or uid", () => {
  const profile = normalizeAdminUserProfile({
    uid: "user-42",
    displayName: "Richard Parker",
    email: "richard@example.com",
  });

  expect(matchesAdminUserSearch(profile, "parker")).toBe(true);
  expect(matchesAdminUserSearch(profile, "example")).toBe(true);
  expect(matchesAdminUserSearch(profile, "42")).toBe(true);
  expect(matchesAdminUserSearch(profile, "sarah")).toBe(false);
});

test("sorts admin users by issue urgency, board size, and then recency", () => {
  const profiles = [
    normalizeAdminUserProfile({
      uid: "me",
      displayName: "Current User",
      blockedCount: 1,
      circularCount: 0,
      taskCount: 5,
      updatedAt: "2026-05-10T09:00:00.000Z",
    }),
    normalizeAdminUserProfile({
      uid: "alpha",
      displayName: "Alpha",
      blockedCount: 2,
      circularCount: 1,
      taskCount: 3,
      updatedAt: "2026-05-09T09:00:00.000Z",
    }),
    normalizeAdminUserProfile({
      uid: "beta",
      displayName: "Beta",
      blockedCount: 1,
      circularCount: 0,
      taskCount: 9,
      updatedAt: "2026-05-11T09:00:00.000Z",
    }),
  ];

  expect(sortAdminUsers(profiles, "me").map((profile) => profile.uid)).toEqual([
    "alpha",
    "beta",
    "me",
  ]);
});
