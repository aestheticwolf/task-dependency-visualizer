import {
  buildDependencyDocId,
  buildDependencyEdgeId,
  buildGraph,
  hasCycle,
} from "./taskLogic";

export const BOARD_EXPORT_APP = "TaskGraph";
export const BOARD_EXPORT_VERSION = 1;

const VALID_LAYOUT_DIRECTIONS = new Set(["TB", "LR", "BT", "RL"]);

function toFiniteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeNodeLabel(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function buildBoardExportPayload({
  nodes = [],
  edges = [],
  layoutDirection = "TB",
  exportedAt = new Date().toISOString(),
  exportedBy = "",
} = {}) {
  return {
    app: BOARD_EXPORT_APP,
    version: BOARD_EXPORT_VERSION,
    exportedAt,
    exportedBy: typeof exportedBy === "string" ? exportedBy.trim() : "",
    layoutDirection: VALID_LAYOUT_DIRECTIONS.has(layoutDirection) ? layoutDirection : "TB",
    nodes: nodes.map(node => ({
      id: String(node.id),
      data: {
        label: normalizeNodeLabel(node?.data?.label),
        completed: Boolean(node?.data?.completed),
      },
      position: {
        x: toFiniteNumber(node?.position?.x),
        y: toFiniteNumber(node?.position?.y),
      },
    })),
    edges: edges.map(edge => ({
      id: buildDependencyEdgeId(String(edge.source), String(edge.target)),
      docId: buildDependencyDocId(String(edge.source), String(edge.target)),
      source: String(edge.source),
      target: String(edge.target),
      animated: edge?.animated !== false,
    })),
  };
}

function parseNode(rawNode, index) {
  const id = typeof rawNode?.id === "string" ? rawNode.id.trim() : "";
  if (!id) {
    throw new Error(`Task ${index + 1} is missing an id.`);
  }

  const label = normalizeNodeLabel(rawNode?.data?.label ?? rawNode?.label);
  if (!label) {
    throw new Error(`Task ${index + 1} is missing a name.`);
  }

  return {
    id,
    data: {
      label,
      completed: rawNode?.data?.completed === true || rawNode?.completed === true,
    },
    position: {
      x: toFiniteNumber(rawNode?.position?.x),
      y: toFiniteNumber(rawNode?.position?.y),
    },
  };
}

function parseEdge(rawEdge, index, nodeIds, seenDependencies) {
  const source = typeof rawEdge?.source === "string" ? rawEdge.source.trim() : "";
  const target = typeof rawEdge?.target === "string" ? rawEdge.target.trim() : "";

  if (!source || !target) {
    throw new Error(`Dependency ${index + 1} is missing its linked tasks.`);
  }

  if (source === target) {
    throw new Error(`Dependency ${index + 1} links a task to itself.`);
  }

  if (!nodeIds.has(source) || !nodeIds.has(target)) {
    throw new Error(`Dependency ${index + 1} references a task that does not exist in this file.`);
  }

  const dependencyKey = buildDependencyDocId(source, target);
  if (seenDependencies.has(dependencyKey)) {
    throw new Error(`Dependency ${index + 1} is duplicated in this file.`);
  }
  seenDependencies.add(dependencyKey);

  return {
    id: buildDependencyEdgeId(source, target),
    source,
    target,
    animated: rawEdge?.animated !== false,
  };
}

export function parseBoardImportFile(fileText) {
  let payload;

  try {
    payload = JSON.parse(fileText);
  } catch {
    throw new Error("This file is not valid JSON. Export a fresh TaskGraph board file and try again.");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("This file does not contain a valid TaskGraph board export.");
  }

  if (typeof payload.version === "number" && payload.version > BOARD_EXPORT_VERSION) {
    throw new Error("This board file was exported by a newer TaskGraph version.");
  }

  if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
    throw new Error("This file is missing the required task or dependency data.");
  }

  const nodes = payload.nodes.map(parseNode);
  const nodeIds = new Set();

  nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      throw new Error(`Task ${index + 1} reuses the id "${node.id}". Each task must be unique.`);
    }
    nodeIds.add(node.id);
  });

  const seenDependencies = new Set();
  const edges = payload.edges.map((edge, index) =>
    parseEdge(edge, index, nodeIds, seenDependencies)
  );

  if (hasCycle(buildGraph(edges))) {
    throw new Error("This board file contains circular dependencies. Remove the cycle and try again.");
  }

  return {
    app: typeof payload.app === "string" ? payload.app : "",
    version: typeof payload.version === "number" ? payload.version : null,
    exportedAt: typeof payload.exportedAt === "string" ? payload.exportedAt : "",
    exportedBy: typeof payload.exportedBy === "string" ? payload.exportedBy : "",
    layoutDirection: VALID_LAYOUT_DIRECTIONS.has(payload.layoutDirection) ? payload.layoutDirection : null,
    nodes,
    edges,
  };
}
