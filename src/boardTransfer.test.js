import {
  BOARD_EXPORT_APP,
  BOARD_EXPORT_VERSION,
  buildBoardExportPayload,
  parseBoardImportFile,
} from "./boardTransfer";

const sampleNodes = [
  {
    id: "1",
    data: { label: "Design", completed: false },
    position: { x: 10, y: 20 },
  },
  {
    id: "2",
    data: { label: "Review", completed: true },
    position: { x: 30, y: 40 },
  },
];

const sampleEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
  },
];

test("builds a board export payload with metadata", () => {
  expect(buildBoardExportPayload({
    nodes: sampleNodes,
    edges: sampleEdges,
    layoutDirection: "LR",
    exportedAt: "2026-04-30T10:00:00.000Z",
    exportedBy: "Richard",
  })).toEqual({
    app: BOARD_EXPORT_APP,
    version: BOARD_EXPORT_VERSION,
    exportedAt: "2026-04-30T10:00:00.000Z",
    exportedBy: "Richard",
    layoutDirection: "LR",
    nodes: sampleNodes,
    edges: [
      {
        id: "e1-2",
        docId: "1__2",
        source: "1",
        target: "2",
        animated: true,
      },
    ],
  });
});

test("parses a valid board import file and normalizes edges", () => {
  const parsed = parseBoardImportFile(JSON.stringify({
    app: BOARD_EXPORT_APP,
    version: BOARD_EXPORT_VERSION,
    layoutDirection: "BT",
    nodes: sampleNodes,
    edges: [{ source: "1", target: "2" }],
  }));

  expect(parsed.layoutDirection).toBe("BT");
  expect(parsed.nodes).toEqual(sampleNodes);
  expect(parsed.edges).toEqual([
    {
      id: "e1-2",
      source: "1",
      target: "2",
      animated: true,
    },
  ]);
});

test("rejects invalid json board files", () => {
  expect(() => parseBoardImportFile("{bad json}")).toThrow(
    "This file is not valid JSON. Export a fresh TaskGraph board file and try again."
  );
});

test("rejects duplicate task ids during import", () => {
  expect(() => parseBoardImportFile(JSON.stringify({
    nodes: [sampleNodes[0], sampleNodes[0]],
    edges: [],
  }))).toThrow('Task 2 reuses the id "1". Each task must be unique.');
});

test("rejects dependencies that point to missing tasks", () => {
  expect(() => parseBoardImportFile(JSON.stringify({
    nodes: [sampleNodes[0]],
    edges: [{ source: "1", target: "2" }],
  }))).toThrow("Dependency 1 references a task that does not exist in this file.");
});

test("rejects circular dependencies during import", () => {
  expect(() => parseBoardImportFile(JSON.stringify({
    nodes: sampleNodes,
    edges: [
      { source: "1", target: "2" },
      { source: "2", target: "1" },
    ],
  }))).toThrow("This board file contains circular dependencies. Remove the cycle and try again.");
});
