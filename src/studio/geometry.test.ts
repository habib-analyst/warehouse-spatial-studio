import { describe, expect, it } from "vitest"
import { clampToParent, fitRectInParent, rectsOverlap, smartSnapRect, snapValue, validateDocument } from "./geometry"
import { createEmptyDocument, createNode } from "./model"

describe("studio geometry", () => {
  it("snaps values and clamps a child fully inside its parent", () => {
    expect(snapValue(13.4)).toBe(13)
    expect(snapValue(13, 4)).toBe(12)
    expect(clampToParent({ x: -3, y: 305, width: 20, depth: 20 }, { width: 244, depth: 310 })).toEqual({ x: 0, y: 290 })
  })

  it("shrinks oversized children so they fit inside the parent", () => {
    expect(fitRectInParent({ x: -5, y: -5, width: 400, depth: 500 }, { width: 100, depth: 80 })).toEqual({
      x: 0,
      y: 0,
      width: 100,
      depth: 80,
    })
  })

  it("smart-snaps to sibling edges within threshold", () => {
    const snapped = smartSnapRect(
      { x: 50.4, y: 10.2, width: 12, depth: 20 },
      { width: 200, depth: 200 },
      [{ x: 62, y: 10, width: 10, depth: 20 }],
      { grid: 1, threshold: 1.5 },
    )
    expect(snapped.x).toBe(50)
    expect(snapped.y).toBe(10)
  })

  it("detects area overlap but not edge contact", () => {
    expect(rectsOverlap({ x: 0, y: 0, width: 10, depth: 10 }, { x: 8, y: 4, width: 10, depth: 10 })).toBe(true)
    expect(rectsOverlap({ x: 0, y: 0, width: 10, depth: 10 }, { x: 10, y: 0, width: 4, depth: 4 })).toBe(false)
  })

  it("reports duplicate codes and overlapping structural siblings", () => {
    const document = createEmptyDocument()
    const first = { ...createNode("hall", document.rootId, document), id: "hall-1", x: 10, y: 10, code: "HL01" }
    document.nodes[first.id] = first
    const second = { ...createNode("hall", document.rootId, document), id: "hall-2", x: 20, y: 20, code: "HL01" }
    document.nodes[second.id] = second

    const issues = validateDocument(document)
    expect(issues.some((issue) => issue.code === "duplicate-code")).toBe(true)
    expect(issues.some((issue) => issue.code === "overlap")).toBe(true)
  })
})
