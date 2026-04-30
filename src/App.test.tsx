import {
  buildGraph,
  formatUnlinkedTaskMessage,
  getBlockingTasks,
  getPendingTaskBlockMessage,
  getTaskDependencies,
  hasCycle,
  hasLinkedDependency,
  isBlocked,
} from "./taskLogic";
import { formatUserDisplayName, getUserInitial } from "./userDisplay";

const nodes = [
  {
    id: "1",
    data: { label: "Design Mockup", completed: false },
  },
  {
    id: "2",
    data: { label: "QA Testing", completed: false },
  },
  {
    id: "3",
    data: { label: "Deployment", completed: false },
  },
];

const edges = [{ id: "e1-2", source: "1", target: "2" }];

test("returns a professional blocked message for pending linked prerequisites", () => {
  expect(isBlocked("2", edges, nodes)).toBe(true);
  expect(getBlockingTasks("2", edges, nodes).map((node) => node.data.label)).toEqual([
    "Design Mockup",
  ]);
  expect(getPendingTaskBlockMessage("2", edges, nodes)).toBe(
    'This task cannot be completed yet because the linked prerequisite "Design Mockup" is still pending.'
  );
});

test("lists multiple pending prerequisites in blocked feedback", () => {
  const blockedNodes = [
    ...nodes,
    { id: "4", data: { label: "Security Review", completed: false } },
    { id: "5", data: { label: "Release Notes", completed: false } },
  ];
  const blockedEdges = [
    ...edges,
    { id: "e4-3", source: "4", target: "3" },
    { id: "e5-3", source: "5", target: "3" },
  ];

  expect(getPendingTaskBlockMessage("3", blockedEdges, blockedNodes)).toBe(
    'This task cannot be completed yet because the linked prerequisites "Security Review" and "Release Notes" are still pending.'
  );
});

test("keeps ready tasks available when they are not blocked", () => {
  expect(isBlocked("3", edges, nodes)).toBe(false);
  expect(getBlockingTasks("3", edges, nodes)).toEqual([]);
  expect(getPendingTaskBlockMessage("3", edges, nodes)).toBeNull();
});

test("requires unlinked tasks to be connected before completion", () => {
  expect(hasLinkedDependency("3", edges)).toBe(false);
  expect(formatUnlinkedTaskMessage("Deployment")).toBe(
    'Link a dependency to "Deployment" before marking it complete.'
  );
});

test("returns parent and child dependencies for tooltip rendering", () => {
  expect(getTaskDependencies("1", edges, nodes).children.map((node) => node.data.label)).toEqual([
    "QA Testing",
  ]);
  expect(getTaskDependencies("1", edges, nodes).parents).toEqual([]);

  expect(getTaskDependencies("2", edges, nodes).parents.map((node) => node.data.label)).toEqual([
    "Design Mockup",
  ]);
  expect(getTaskDependencies("2", edges, nodes).children).toEqual([]);
});

test("still detects circular dependencies", () => {
  const cyclicEdges = [...edges, { id: "e2-1", source: "2", target: "1" }];

  expect(hasCycle(buildGraph(cyclicEdges))).toBe(true);
});

test("uses the profile display name when it exists", () => {
  expect(
    formatUserDisplayName({
      displayName: "Test User",
      email: "test@gmail.com",
    })
  ).toBe("Test User");
});

test("falls back to a friendly name from email", () => {
  const user = { email: "test.user_demo@gmail.com" };

  expect(formatUserDisplayName(user)).toBe("Test User Demo");
  expect(getUserInitial(user)).toBe("T");
});
