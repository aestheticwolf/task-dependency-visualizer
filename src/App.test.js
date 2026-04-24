import {
  buildGraph,
  formatUnlinkedTaskMessage,
  getBlockingTasks,
  hasLinkedDependency,
  getPendingTaskBlockMessage,
  hasCycle,
  isBlocked,
} from "./taskLogic";

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

const edges = [
  { id: "e1-2", source: "1", target: "2" },
];

test("returns a professional blocked message for pending linked prerequisites", () => {
  expect(isBlocked("2", edges, nodes)).toBe(true);
  expect(getBlockingTasks("2", edges, nodes).map((node) => node.data.label)).toEqual([
    "Design Mockup",
  ]);
  expect(getPendingTaskBlockMessage("2", edges, nodes)).toBe(
    'This task cannot be completed yet because the linked prerequisite "Design Mockup" is still pending.'
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

test("still detects circular dependencies", () => {
  const cyclicEdges = [...edges, { id: "e2-1", source: "2", target: "1" }];

  expect(hasCycle(buildGraph(cyclicEdges))).toBe(true);
});
