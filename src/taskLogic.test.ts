import {
  buildDependencyDocId,
  buildDependencyEdgeId,
  formatBlockedTaskSummary,
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
