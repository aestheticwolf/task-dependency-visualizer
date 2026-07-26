import {
  buildDependencyDocId,
  buildDependencyEdgeId,
  formatBlockedTaskSummary,
  getCircularDependencyEdgeIds,
  getCircularDependencyGroups,
  getCircularDependencyNodeIds,
  getTaskStatusSummary,
  getTaskWorkflowStatus,
  matchesTaskSearch,
  matchesTaskViewFilter,
  validateDependencyLink,
} from "./taskLogic";

const nodes = [
  { id: "1", data: { label: "Design Mockup", completed: false } },
  { id: "2", data: { label: "QA Testing", completed: false } },
  { id: "3", data: { label: "Deployment", completed: false } },
];

test("builds stable dependency identifiers", () => {
  expect(buildDependencyEdgeId("1", "2")).toBe("e1-2");
  expect(buildDependencyDocId("1", "2")).toBe("1__2");
});

test("returns explicit feedback for self-links", () => {
  expect(
    validateDependencyLink({
      sourceId: "1",
      targetId: "1",
      nodes,
      edges: [],
    })
  ).toEqual({
    code: "self-link",
    type: "warn",
    message: "A task cannot depend on itself. Choose two different tasks.",
    blocking: true,
  });
});

test("rejects links when selected tasks no longer exist", () => {
  expect(
    validateDependencyLink({
      sourceId: "1",
      targetId: "4",
      nodes,
      edges: [],
    })
  ).toEqual({
    code: "missing-task",
    type: "warn",
    message: "One or both selected tasks no longer exist. Refresh the task list and try again.",
    blocking: true,
  });
});

test("rejects duplicate dependencies", () => {
  expect(
    validateDependencyLink({
      sourceId: "1",
      targetId: "2",
      nodes,
      edges: [{ id: "e1-2", source: "1", target: "2" }],
    })
  ).toEqual({
    code: "duplicate",
    type: "warn",
    message: "Dependency already exists.",
    blocking: true,
  });
});

test("rejects circular dependencies", () => {
  expect(
    validateDependencyLink({
      sourceId: "2",
      targetId: "1",
      nodes,
      edges: [{ id: "e1-2", source: "1", target: "2" }],
    })
  ).toEqual({
    code: "cycle",
    type: "error",
    message: "Circular dependency detected. Choose a different task relationship.",
    blocking: true,
  });
});

test("allows circular dependencies when explicitly enabled for visualization", () => {
  expect(
    validateDependencyLink({
      sourceId: "2",
      targetId: "1",
      nodes,
      edges: [{ id: "e1-2", source: "1", target: "2" }],
      allowCycle: true,
    })
  ).toEqual({
    code: "cycle",
    type: "warn",
    message: "This link creates a circular dependency. It will be highlighted in Cycles and Details.",
    blocking: false,
  });
});

test("summarizes blocked prerequisites for a single task", () => {
  expect(
    formatBlockedTaskSummary([{ id: "1", data: { label: "Design Mockup", completed: false } }])
  ).toBe('Waiting on "Design Mockup" to be completed.');
});

test("summarizes multiple blocked prerequisites concisely", () => {
  expect(
    formatBlockedTaskSummary([
      { id: "1", data: { label: "Design Mockup", completed: false } },
      { id: "2", data: { label: "API Review", completed: false } },
      { id: "3", data: { label: "QA Testing", completed: false } },
    ])
  ).toBe(
    'Waiting on "Design Mockup", "API Review", and 1 more to be completed before this task can start.'
  );
});

test("returns workflow statuses for ready, blocked, unlinked, and completed tasks", () => {
  const workflowNodes = [
    { id: "1", data: { label: "Design Mockup", completed: false } },
    { id: "2", data: { label: "QA Testing", completed: false } },
    { id: "3", data: { label: "Deployment", completed: false } },
    { id: "4", data: { label: "Release", completed: true } },
  ];
  const workflowEdges = [{ id: "e1-2", source: "1", target: "2" }];

  expect(getTaskWorkflowStatus(workflowNodes[0], workflowEdges, workflowNodes)).toBe("ready");
  expect(getTaskWorkflowStatus(workflowNodes[1], workflowEdges, workflowNodes)).toBe("blocked");
  expect(getTaskWorkflowStatus(workflowNodes[2], workflowEdges, workflowNodes)).toBe("unlinked");
  expect(getTaskWorkflowStatus(workflowNodes[3], workflowEdges, workflowNodes)).toBe("complete");
});

test("matches task view filters using workflow status", () => {
  const workflowEdges = [{ id: "e1-2", source: "1", target: "2" }];

  expect(matchesTaskViewFilter(nodes[0], workflowEdges, nodes, "open")).toBe(true);
  expect(matchesTaskViewFilter(nodes[1], workflowEdges, nodes, "blocked")).toBe(true);
  expect(matchesTaskViewFilter(nodes[2], workflowEdges, nodes, "unlinked")).toBe(true);
  expect(matchesTaskViewFilter(nodes[0], workflowEdges, nodes, "complete")).toBe(false);
});

test("detects circular dependency groups, nodes, and edges", () => {
  const cycleNodes = [
    ...nodes,
    { id: "4", data: { label: "Release", completed: false } },
  ];
  const cycleEdges = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e2-3", source: "2", target: "3" },
    { id: "e3-1", source: "3", target: "1" },
    { id: "e3-4", source: "3", target: "4" },
  ];

  expect(getCircularDependencyGroups(cycleNodes, cycleEdges)).toEqual([
    {
      nodeIds: ["1", "2", "3"],
      edgeIds: ["e1-2", "e2-3", "e3-1"],
    },
  ]);
  expect(getCircularDependencyNodeIds(cycleNodes, cycleEdges)).toEqual(["1", "2", "3"]);
  expect(getCircularDependencyEdgeIds(cycleNodes, cycleEdges)).toEqual(["e1-2", "e2-3", "e3-1"]);
});

test("matches the cycle filter using detected circular dependency ids", () => {
  const cycleEdges = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e2-3", source: "2", target: "3" },
    { id: "e3-1", source: "3", target: "1" },
  ];
  const cycleNodeIds = new Set(getCircularDependencyNodeIds(nodes, cycleEdges));

  expect(matchesTaskViewFilter(nodes[0], cycleEdges, nodes, "cycle", cycleNodeIds)).toBe(true);
  expect(matchesTaskViewFilter(
    { id: "4", data: { label: "Release", completed: false } },
    cycleEdges,
    [...nodes, { id: "4", data: { label: "Release", completed: false } }],
    "cycle",
    cycleNodeIds
  )).toBe(false);
});

test("matches task search case-insensitively", () => {
  expect(matchesTaskSearch(nodes[0], "design")).toBe(true);
  expect(matchesTaskSearch(nodes[0], "MOCK")).toBe(true);
  expect(matchesTaskSearch(nodes[1], "deploy")).toBe(false);
});

test("summarizes total, completed, pending, blocked, ready, and unlinked tasks", () => {
  const workflowNodes = [
    { id: "1", data: { label: "Design Mockup", completed: false } },
    { id: "2", data: { label: "QA Testing", completed: false } },
    { id: "3", data: { label: "Deployment", completed: false } },
    { id: "4", data: { label: "Release", completed: true } },
  ];
  const workflowEdges = [{ id: "e1-2", source: "1", target: "2" }];

  expect(getTaskStatusSummary(workflowNodes, workflowEdges)).toEqual({
    total: 4,
    completed: 1,
    pending: 3,
    blocked: 1,
    ready: 1,
    unlinked: 1,
  });
});
