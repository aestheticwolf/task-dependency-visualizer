export function buildGraph(edges) {
  const graph = {};
  edges.forEach((edge) => {
    if (!graph[edge.source]) graph[edge.source] = [];
    graph[edge.source].push(edge.target);
  });
  return graph;
}

export function hasCycle(graph) {
  const visited = new Set();
  const stack = new Set();

  function dfs(nodeId) {
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

export function getBlockingTasks(id, edges, nodes) {
  return edges
    .filter((edge) => edge.target === id)
    .map((edge) => nodes.find((node) => node.id === edge.source))
    .filter((node) => node && !node.data.completed);
}

export function hasLinkedDependency(id, edges) {
  return edges.some((edge) => edge.source === id || edge.target === id);
}

export function formatBlockedTaskMessage(blockers) {
  if (!blockers.length) {
    return "This task cannot be completed until its linked prerequisites are ready.";
  }

  if (blockers.length === 1) {
    return `This task cannot be completed yet because the linked prerequisite "${blockers[0].data.label}" is still pending.`;
  }

  return `This task cannot be completed yet because ${blockers.length} linked prerequisite tasks are still pending.`;
}

export function formatUnlinkedTaskMessage(label) {
  return `Link a dependency to "${label}" before marking it complete.`;
}

export function isBlocked(id, edges, nodes) {
  return getBlockingTasks(id, edges, nodes).length > 0;
}

export function getPendingTaskBlockMessage(id, edges, nodes) {
  const blockers = getBlockingTasks(id, edges, nodes);
  return blockers.length ? formatBlockedTaskMessage(blockers) : null;
}
