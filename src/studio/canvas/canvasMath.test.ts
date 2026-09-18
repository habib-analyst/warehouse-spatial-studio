import { describe, expect, it } from "vitest"
import { createEmptyDocument, createNode } from "../model"
import { absolutePosition, fitView, pointToParentLocal, zoomAtPointer } from "./canvasMath"

describe("2D canvas math", () => {
  it("fits warehouse bounds into the available canvas with centered offsets", () => {
    const view = fitView({ width: 800, height: 600 }, { width: 244, depth: 310 }, 48)
    expect(view.scale).toBeCloseTo(1.6258064516, 10)
    expect(view.offsetX).toBeCloseTo(201.6516129032, 10)
    expect(view.offsetY).toBe(48)
  })

  it("keeps the world point below the cursor fixed while zooming", () => {
    const next = zoomAtPointer({ scale: 1, offsetX: 100, offsetY: 50 }, { x: 300, y: 250 }, 2)
    expect(next).toEqual({ scale: 2, offsetX: -100, offsetY: -150 })
  })

  it("converts an absolute drop point into parent-local coordinates", () => {
    const document = createEmptyDocument()
    const hall = { ...createNode("hall", document.rootId, document), id: "hall", x: 20, y: 30 }
    document.nodes[hall.id] = hall
    const aisle = { ...createNode("aisle", hall.id, document), id: "aisle", x: 5, y: 7 }
    document.nodes[aisle.id] = aisle

    expect(absolutePosition(document, aisle.id)).toEqual({ x: 25, y: 37 })
    expect(pointToParentLocal(document, hall.id, { x: 70, y: 90 })).toEqual({ x: 50, y: 60 })
  })
})
