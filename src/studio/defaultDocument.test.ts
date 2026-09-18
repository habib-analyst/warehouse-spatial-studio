import { describe, expect, it } from "vitest"
import { childrenOf } from "./model"
import { rectsOverlap } from "./geometry"
import { createDefaultDocument, DEFAULT_LAYOUT } from "./defaultDocument"

describe("default warehouse document", () => {
  it("seeds the starter hierarchy and keeps siblings inside parents without overlap", () => {
    const document = createDefaultDocument()
    const root = document.nodes[document.rootId]
    const top = childrenOf(document, root.id)
    expect(top.filter((node) => node.type === "hall")).toHaveLength(DEFAULT_LAYOUT.halls)
    expect(top.filter((node) => node.type === "room")).toHaveLength(DEFAULT_LAYOUT.rooms)
    expect(top.filter((node) => node.type === "openStore")).toHaveLength(DEFAULT_LAYOUT.openStores)
    expect(top.filter((node) => node.type === "gate")).toHaveLength(DEFAULT_LAYOUT.gates)

    const hall = top.find((node) => node.type === "hall")!
    const aisles = childrenOf(document, hall.id).filter((node) => node.type === "aisle")
    expect(aisles.filter((node) => node.aisleOrientation === "vertical")).toHaveLength(DEFAULT_LAYOUT.verticalAisles)
    expect(aisles.filter((node) => node.aisleOrientation === "horizontal")).toHaveLength(DEFAULT_LAYOUT.horizontalAisles)

    const aisle = aisles[0]
    const racks = childrenOf(document, aisle.id).filter((node) => node.type === "rack")
    expect(racks).toHaveLength(DEFAULT_LAYOUT.racks)
    const shelves = childrenOf(document, racks[0].id).filter((node) => node.type === "shelf")
    expect(shelves).toHaveLength(DEFAULT_LAYOUT.shelves)
    expect(childrenOf(document, shelves[0].id).filter((node) => node.type === "bin")).toHaveLength(DEFAULT_LAYOUT.bins)

    const structural = top.filter((node) => !["gate", "shutter"].includes(node.type))
    for (let i = 0; i < structural.length; i += 1) {
      for (let j = i + 1; j < structural.length; j += 1) {
        expect(rectsOverlap(structural[i], structural[j])).toBe(false)
      }
      const child = structural[i]
      expect(child.x + child.width).toBeLessThanOrEqual(root.width + 0.05)
      expect(child.y + child.depth).toBeLessThanOrEqual(root.depth + 0.05)
    }
  }, 60_000)
})
