import { describe, expect, it } from "vitest"
import { childrenOf, createEmptyDocument, createNode, type NodeType, type StudioDocument } from "./model"
import { rectsOverlap } from "./geometry"
import { autoLayoutTree, defaultChildSize, LAYOUT_CAPACITY, shelfSizeForBins } from "./placement"

function add(document: StudioDocument, type: NodeType, parentId: string, options?: { aisleOrientation?: "vertical" | "horizontal" }) {
  const node = { ...createNode(type, parentId, document), ...defaultChildSize(type, options?.aisleOrientation) }
  if (options?.aisleOrientation) node.aisleOrientation = options.aisleOrientation
  document.nodes[node.id] = node
  autoLayoutTree(document, parentId)
  return document.nodes[node.id]
}

function assertChildrenInside(document: StudioDocument, parentId: string) {
  const parent = document.nodes[parentId]
  for (const child of childrenOf(document, parentId)) {
    expect(child.x).toBeGreaterThanOrEqual(-0.01)
    expect(child.y).toBeGreaterThanOrEqual(-0.01)
    expect(child.x + child.width).toBeLessThanOrEqual(parent.width + 0.05)
    expect(child.y + child.depth).toBeLessThanOrEqual(parent.depth + 0.05)
  }
}

function assertNoOverlap(document: StudioDocument, parentId: string) {
  const kids = childrenOf(document, parentId).filter((node) => !["shutter", "gate"].includes(node.type))
  for (let i = 0; i < kids.length; i += 1) {
    for (let j = i + 1; j < kids.length; j += 1) {
      expect(rectsOverlap(kids[i], kids[j])).toBe(false)
    }
  }
}

describe("intelligent auto layout", () => {
  it("sizes a shelf for 10 bins and expands when more bins are added", () => {
    const base = shelfSizeForBins(LAYOUT_CAPACITY.shelfBins)
    expect(base.cols).toBe(8)
    expect(base.width).toBeGreaterThan(20)

    const document = createEmptyDocument()
    const hall = add(document, "hall", document.rootId)
    const aisle = add(document, "aisle", hall.id)
    const rack = add(document, "rack", aisle.id)
    const shelf = add(document, "shelf", rack.id)
    const ten = Array.from({ length: 10 }, () => add(document, "bin", shelf.id))
    expect(ten).toHaveLength(10)
    expect(document.nodes[shelf.id].width).toBeGreaterThanOrEqual(base.width - 0.1)
    const depthAtTen = document.nodes[shelf.id].depth

    Array.from({ length: 7 }, () => add(document, "bin", shelf.id))
    expect(document.nodes[shelf.id].depth).toBeGreaterThan(depthAtTen)
    expect(childrenOfBins(document, shelf.id)).toBe(17)
    assertChildrenInside(document, shelf.id)
    assertNoOverlap(document, shelf.id)
  })

  it("arranges multiple halls in the warehouse and grows when past default capacity", () => {
    const document = createEmptyDocument()
    const start = document.nodes[document.rootId]
    const halls = Array.from({ length: 4 }, () => add(document, "hall", document.rootId))
    expect(halls).toHaveLength(4)
    expect(document.nodes[document.rootId].width).toBeGreaterThanOrEqual(start.width)

    add(document, "hall", document.rootId)
    expect(document.nodes[document.rootId].depth).toBeGreaterThanOrEqual(start.depth)
    assertChildrenInside(document, document.rootId)
    assertNoOverlap(document, document.rootId)
  })

  it("keeps halls with aisles non-overlapping and inside the warehouse", () => {
    const document = createEmptyDocument()
    const halls = Array.from({ length: 4 }, () => add(document, "hall", document.rootId))
    halls.forEach((hall) => {
      add(document, "aisle", hall.id, { aisleOrientation: "vertical" })
      add(document, "aisle", hall.id, { aisleOrientation: "horizontal" })
    })
    assertChildrenInside(document, document.rootId)
    assertNoOverlap(document, document.rootId)
    halls.forEach((hall) => {
      assertChildrenInside(document, hall.id)
      assertNoOverlap(document, hall.id)
    })
  })

  it("fits up to 10 racks in an aisle and expands for more", () => {
    const document = createEmptyDocument()
    const hall = add(document, "hall", document.rootId)
    const aisle = add(document, "aisle", hall.id)
    const before = document.nodes[aisle.id].depth
    Array.from({ length: 10 }, () => add(document, "rack", aisle.id))
    expect(childrenOfType(document, aisle.id, "rack")).toBe(10)
    add(document, "rack", aisle.id)
    expect(document.nodes[aisle.id].depth).toBeGreaterThan(before)
    assertChildrenInside(document, aisle.id)
    assertNoOverlap(document, aisle.id)
    assertChildrenInside(document, hall.id)
    assertChildrenInside(document, document.rootId)
  })

  it("stacks default shelves in a rack with gaps", () => {
    const document = createEmptyDocument()
    const hall = add(document, "hall", document.rootId)
    const aisle = add(document, "aisle", hall.id)
    const rack = add(document, "rack", aisle.id)
    const shelves = Array.from({ length: 5 }, () => add(document, "shelf", rack.id))
    expect(shelves.map((shelf) => shelf.y).every((y, index, all) => index === 0 || y > all[index - 1])).toBe(true)
    add(document, "shelf", rack.id)
    expect(document.nodes[rack.id].depth).toBeGreaterThan(30)
    assertNoOverlap(document, rack.id)
    assertChildrenInside(document, rack.id)
  })
})

function childrenOfType(document: StudioDocument, parentId: string, type: NodeType) {
  return Object.values(document.nodes).filter((node) => node.parentId === parentId && node.type === type).length
}

function childrenOfBins(document: StudioDocument, shelfId: string) {
  return childrenOfType(document, shelfId, "bin")
}
