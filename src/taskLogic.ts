export type TaskNode = {
  id: string;
  data: {
    label: string;
    completed: boolean;
  };
  position?: {
    x: number;
    y: number;
  };
};

export type TaskEdge = {
  id?: string;
  source: string;
  target: string;
  animated?: boolean;
};

type TaskGraph = Record<string, string[]>;

type DependencyValidationInput = {
  sourceId?: string | null;
  targetId?: string | null;
  nodes?: TaskNode[];
  edges?: TaskEdge[];
};

type DependencyValidationResult = {
  code: "missing-selection" | "self-link" | "missing-task" | "duplicate" | "cycle";
  type: "warn" | "error";
  message: string;
} | null;

export function buildGraph(edges: TaskEdge[]): TaskGraph {
  const graph: TaskGraph = {};

  edges.forEach((edge) => {
    if (!graph[edge.source]) {
      graph[edge.source] = [];
    }

    graph[edge.source].push(edge.target);
  });

  return graph;
}

export function hasCycle(graph: TaskGraph): boolean {
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (stack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    for (const childId of graph[nodeId] || []) {
      if (dfs(childId)) return true;
    }

    stack.delete(nodeId);
    return false;
  }

  return Object.keys(graph).some(dfs);
}

export function getBlockingTasks(id: string, edges: TaskEdge[], nodes: TaskNode[]): TaskNode[] {
  return edges
    .filter((edge) => edge.target === id)
    .map((edge) => nodes.find((node) => node.id === edge.source))
    .filter((node): node is TaskNode => Boolean(node) && !node.data.completed);
}

export function hasLinkedDependency(id: string, edges: TaskEdge[]): boolean {
  return edges.some((edge) => edge.source === id || edge.target === id);
}

export function buildDependencyEdgeId(sourceId: string, targetId: string): string {
  return `e${sourceId}-${targetId}`;
}

export function buildDependencyDocId(sourceId: string, targetId: string): string {
  return `${sourceId}__${targetId}`;
}

export function validateDependencyLink({
  sourceId,
  targetId,
  nodes = [],
  edges = [],
}: DependencyValidationInput): DependencyValidationResult {
  if (!sourceId || !targetId) {
    return {
      code: "missing-selection",
      type: "warn",
      message: "Select both parent and child tasks before linking them.",
    };
  }

  if (sourceId === targetId) {
    return {
      code: "self-link",
      type: "warn",
      message: "A task cannot depend on itself. Choose two different tasks.",
    };
  }

  const nodeIds = new Set(nodes.map((node) => node.id).filter(Boolean));
  if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
    return {
      code: "missing-task",
      type: "warn",
      message: "One or both selected tasks no longer exist. Refresh the task list and try again.",
    };
  }

  if (edges.some((edge) => edge.source === sourceId && edge.target === targetId)) {
    return {
      code: "duplicate",
      type: "warn",
      message: "Dependency already exists.",
    };
  }

  const nextEdge: TaskEdge = {
    id: buildDependencyEdgeId(sourceId, targetId),
    source: sourceId,
    target: targetId,
  };

  if (hasCycle(buildGraph([...edges, nextEdge]))) {
    return {
      code: "cycle",
      type: "error",
      message: "Circular dependency detected. Choose a different task relationship.",
    };
  }

  return null;
}

export function formatBlockedTaskMessage(blockers: TaskNode[]): string {
  if (!blockers.length) {
    return "This task cannot be completed until its linked prerequisites are ready.";
  }

  const blockerList = formatBlockingTaskNames(blockers);

  if (blockers.length === 1) {
    return `This task cannot be completed yet because the linked prerequisite ${blockerList} is still pending.`;
  }

  return `This task cannot be completed yet because the linked prerequisites ${blockerList} are still pending.`;
}

export function formatUnlinkedTaskMessage(label: string): string {
  return `Link a dependency to "${label}" before marking it complete.`;
}

export function formatBlockedTaskSummary(blockers: TaskNode[]): string | null {
  if (!blockers.length) {
    return null;
  }

  if (blockers.length === 1) {
    return `Waiting on ${formatBlockingTaskNames(blockers)} to be completed.`;
  }

  return `Waiting on ${formatBlockingTaskNames(blockers)} to be completed before this task can start.`;
}

export function isBlocked(id: string, edges: TaskEdge[], nodes: TaskNode[]): boolean {
  return getBlockingTasks(id, edges, nodes).length > 0;
}

export function getTaskWorkflowStatus(
  node: TaskNode | null | undefined,
  edges: TaskEdge[],
  nodes: TaskNode[]
): "unknown" | "complete" | "unlinked" | "blocked" | "ready" {
  if (!node) {
    return "unknown";
  }

  if (node.data.completed) {
    return "complete";
  }

  if (!hasLinkedDependency(node.id, edges)) {
    return "unlinked";
  }

  if (isBlocked(node.id, edges, nodes)) {
    return "blocked";
  }

  return "ready";
}

export function matchesTaskViewFilter(
  node: TaskNode,
  edges: TaskEdge[],
  nodes: TaskNode[],
  filterId = "all"
): boolean {
  if (filterId === "all") {
    return true;
  }

  const status = getTaskWorkflowStatus(node, edges, nodes);
  if (filterId === "open") {
    return status === "ready";
  }

  return status === filterId;
}

export function matchesTaskSearch(node: TaskNode, query = ""): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return node.data.label.toLowerCase().includes(normalizedQuery);
}

export function getTaskStatusSummary(nodes: TaskNode[] = [], edges: TaskEdge[] = []) {
  return nodes.reduce(
    (summary, node) => {
      const status = getTaskWorkflowStatus(node, edges, nodes);

      summary.total += 1;
      if (status === "complete") {
        summary.completed += 1;
      } else {
        summary.pending += 1;
      }

      if (status === "blocked") {
        summary.blocked += 1;
      }

      if (status === "ready") {
        summary.ready += 1;
      }

      if (status === "unlinked") {
        summary.unlinked += 1;
      }

      return summary;
    },
    {
      total: 0,
      completed: 0,
      pending: 0,
      blocked: 0,
      ready: 0,
      unlinked: 0,
    }
  );
}

export function getPendingTaskBlockMessage(
  id: string,
  edges: TaskEdge[],
  nodes: TaskNode[]
): string | null {
  const blockers = getBlockingTasks(id, edges, nodes);
  return blockers.length ? formatBlockedTaskMessage(blockers) : null;
}

export function getTaskDependencies(id: string, edges: TaskEdge[], nodes: TaskNode[]) {
  const parents = edges
    .filter((edge) => edge.target === id)
    .map((edge) => nodes.find((node) => node.id === edge.source))
    .filter((node): node is TaskNode => Boolean(node));

  const children = edges
    .filter((edge) => edge.source === id)
    .map((edge) => nodes.find((node) => node.id === edge.target))
    .filter((node): node is TaskNode => Boolean(node));

  return { parents, children };
}

export function formatTooltipContent(node: TaskNode, edges: TaskEdge[], nodes: TaskNode[]): string {
  const { parents, children } = getTaskDependencies(node.id, edges, nodes);
  const { completed, label } = node.data;
  const blockers = getBlockingTasks(node.id, edges, nodes);
  const blockedSummary = formatBlockedTaskSummary(blockers);

  let tooltip = `<b>${label}</b><br/>`;

  if (completed) {
    tooltip += "✓ Completed<br/>";
  } else if (blockers.length) {
    tooltip += "🔒 Blocked<br/>";
    if (blockedSummary) {
      tooltip += `${blockedSummary}<br/>`;
    }
  } else {
    tooltip += "⚪ Ready<br/>";
  }

  if (parents.length) {
    tooltip += "<br/>⬅ Depends on:<br/>";
    parents.forEach((parent) => {
      tooltip += `○ ${parent.data.label}<br/>`;
    });
  }

  if (children.length) {
    tooltip += "<br/>➡ Required by:<br/>";
    children.forEach((child) => {
      tooltip += `○ ${child.data.label}<br/>`;
    });
  }

  return tooltip;
}

function formatBlockingTaskNames(blockers: TaskNode[]): string {
  const labels = blockers.map((blocker) => `"${blocker.data.label}"`);

  if (!labels.length) {
    return "the linked prerequisites";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels[0]}, ${labels[1]}, and ${labels.length - 2} more`;
}
