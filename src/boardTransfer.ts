import {
  buildDependencyDocId,
  buildDependencyEdgeId,
  buildGraph,
  hasCycle,
  type TaskEdge,
  type TaskNode,
} from "./taskLogic";

export const BOARD_EXPORT_APP = "TaskGraph";
export const BOARD_EXPORT_VERSION = 1;

type LayoutDirection = "TB" | "LR" | "BT" | "RL";

type BoardExportEdge = TaskEdge & {
  id: string;
  docId: string;
  animated: boolean;
};

type BoardExportPayload = {
  app: string;
  version: number;
  exportedAt: string;
  exportedBy: string;
  layoutDirection: LayoutDirection;
  nodes: TaskNode[];
  edges: BoardExportEdge[];
};

type RawBoardNode = Partial<TaskNode> & {
  label?: unknown;
  completed?: unknown;
  data?: {
    label?: unknown;
    completed?: unknown;
  };
};

type RawBoardEdge = Partial<TaskEdge> & {
  animated?: unknown;
};

type ParsedBoardImport = {
  app: string;
  version: number | null;
  exportedAt: string;
  exportedBy: string;
  layoutDirection: LayoutDirection | null;
  nodes: TaskNode[];
  edges: TaskEdge[];
};

const VALID_LAYOUT_DIRECTIONS = new Set<LayoutDirection>(["TB", "LR", "BT", "RL"]);

function toFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeNodeLabel(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function buildBoardExportPayload({
  nodes = [],
  edges = [],
  layoutDirection = "TB",
  exportedAt = new Date().toISOString(),
  exportedBy = "",
}: {
  nodes?: TaskNode[];
  edges?: TaskEdge[];
  layoutDirection?: LayoutDirection;
  exportedAt?: string;
  exportedBy?: string;
} = {}): BoardExportPayload {
  return {
    app: BOARD_EXPORT_APP,
    version: BOARD_EXPORT_VERSION,
    exportedAt,
    exportedBy: typeof exportedBy === "string" ? exportedBy.trim() : "",
    layoutDirection: VALID_LAYOUT_DIRECTIONS.has(layoutDirection) ? layoutDirection : "TB",
    nodes: nodes.map((node) => ({
      id: String(node.id),
      data: {
        label: normalizeNodeLabel(node.data?.label),
        completed: Boolean(node.data?.completed),
      },
      position: {
        x: toFiniteNumber(node.position?.x),
        y: toFiniteNumber(node.position?.y),
      },
    })),
    edges: edges.map((edge) => ({
      id: buildDependencyEdgeId(String(edge.source), String(edge.target)),
      docId: buildDependencyDocId(String(edge.source), String(edge.target)),
      source: String(edge.source),
      target: String(edge.target),
      animated: edge.animated !== false,
    })),
  };
}

function parseNode(rawNode: RawBoardNode, index: number): TaskNode {
  const id = typeof rawNode.id === "string" ? rawNode.id.trim() : "";
  if (!id) {
    throw new Error(`Task ${index + 1} is missing an id.`);
  }

  const label = normalizeNodeLabel(rawNode.data?.label ?? rawNode.label);
  if (!label) {
    throw new Error(`Task ${index + 1} is missing a name.`);
  }

  return {
    id,
    data: {
      label,
      completed: rawNode.data?.completed === true || rawNode.completed === true,
    },
    position: {
      x: toFiniteNumber(rawNode.position?.x),
      y: toFiniteNumber(rawNode.position?.y),
    },
  };
}

function parseEdge(
  rawEdge: RawBoardEdge,
  index: number,
  nodeIds: Set<string>,
  seenDependencies: Set<string>
): TaskEdge {
  const source = typeof rawEdge.source === "string" ? rawEdge.source.trim() : "";
  const target = typeof rawEdge.target === "string" ? rawEdge.target.trim() : "";

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
    animated: rawEdge.animated !== false,
  };
}

export function parseBoardImportFile(fileText: string): ParsedBoardImport {
  let payload: unknown;

  try {
    payload = JSON.parse(fileText) as unknown;
  } catch {
    throw new Error("This file is not valid JSON. Export a fresh TaskGraph board file and try again.");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("This file does not contain a valid TaskGraph board export.");
  }

  const boardPayload = payload as {
    app?: unknown;
    version?: unknown;
    exportedAt?: unknown;
    exportedBy?: unknown;
    layoutDirection?: unknown;
    nodes?: unknown;
    edges?: unknown;
  };

  if (typeof boardPayload.version === "number" && boardPayload.version > BOARD_EXPORT_VERSION) {
    throw new Error("This board file was exported by a newer TaskGraph version.");
  }

  if (!Array.isArray(boardPayload.nodes) || !Array.isArray(boardPayload.edges)) {
    throw new Error("This file is missing the required task or dependency data.");
  }

  const nodes = boardPayload.nodes.map((node, index) => parseNode(node as RawBoardNode, index));
  const nodeIds = new Set<string>();

  nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      throw new Error(`Task ${index + 1} reuses the id "${node.id}". Each task must be unique.`);
    }
    nodeIds.add(node.id);
  });

  const seenDependencies = new Set<string>();
  const edges = boardPayload.edges.map((edge, index) =>
    parseEdge(edge as RawBoardEdge, index, nodeIds, seenDependencies)
  );

  if (hasCycle(buildGraph(edges))) {
    throw new Error("This board file contains circular dependencies. Remove the cycle and try again.");
  }

  return {
    app: typeof boardPayload.app === "string" ? boardPayload.app : "",
    version: typeof boardPayload.version === "number" ? boardPayload.version : null,
    exportedAt: typeof boardPayload.exportedAt === "string" ? boardPayload.exportedAt : "",
    exportedBy: typeof boardPayload.exportedBy === "string" ? boardPayload.exportedBy : "",
    layoutDirection: VALID_LAYOUT_DIRECTIONS.has(boardPayload.layoutDirection as LayoutDirection)
      ? (boardPayload.layoutDirection as LayoutDirection)
      : null,
    nodes,
    edges,
  };
}
