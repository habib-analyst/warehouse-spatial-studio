import { describe, expect, it } from "vitest"
import { createEmptyDocument, createNode, type StudioDocument } from "../model"
import { nextPlacement } from "../placement"
import { projectScope, projectionKind } from "./visualProjection"

function add(document: StudioDocument, type: "hall" | "aisle" | "rack" | "shelf" | "bin", parentId: string) {
  const node = createNode(type, parentId, document)
  Object.assign(node, nextPlacement(document, parentId, type, node))
  document.nodes[node.id] = node
  return node
}

describe("level-specific visual projection", () => {
  it("selects a projection appropriate to the open hierarchy level", () => {
    expect(projectionKind("warehouse")).toBe("floor")
    expect(projectionKind("hall")).toBe("floor")
    expect(projectionKind("aisle")).toBe("aisle-detail")
    expect(projectionKind("rack")).toBe("rack-elevation")
    expect(projectionKind("shelf")).toBe("shelf-detail")
    expect(projectionKind("bin")).toBe("bin-detail")
  })

  it("projects shelves as readable rack levels without mutating physical dimensions", () => {
    const document = createEmptyDocument()
    const hall = add(document, "hall", document.rootId)
    const aisle = add(document, "aisle", hall.id)
    const rack = add(document, "rack", aisle.id)
    const shelf1 = add(document, "shelf", rack.id)
    const shelf2 = add(document, "shelf", rack.id)
    const before = JSON.stringify(document)

    const projection = projectScope(document, rack.id)

    expect(projection.kind).toBe("rack-elevation")
    expect(projection.nodes.map(({ id, x, y, width, depth }) => ({ id, x, y, width, depth }))).toEqual([
      { id: shelf1.id, x: 6, y: 51, width: 88, depth: 8 },
      { id: shelf2.id, x: 6, y: 39, width: 88, depth: 8 },
    ])
    expect(JSON.stringify(document)).toBe(before)
  })

  it("projects bins as readable shelf compartments regardless of tiny real size", () => {
    const document = createEmptyDocument()
    const hall = add(document, "hall", document.rootId)
    const aisle = add(document, "aisle", hall.id)
    const rack = add(document, "rack", aisle.id)
    const shelf = add(document, "shelf", rack.id)
    const bin1 = add(document, "bin", shelf.id)
    const bin2 = add(document, "bin", shelf.id)

    const projection = projectScope(document, shelf.id)
    expect(projection.nodes.map(({ id, x, y, width, depth }) => ({ id, x, y, width, depth }))).toEqual([
      { id: bin1.id, x: 4, y: 18, width: 45, depth: 34 },
      { id: bin2.id, x: 51, y: 18, width: 45, depth: 34 },
    ])
  })
})
