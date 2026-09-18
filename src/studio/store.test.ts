import { beforeEach, describe, expect, it } from "vitest"
import { createEmptyDocument } from "./model"
import { useStudioStore } from "./store"

describe("studio store", () => {
  beforeEach(() => {
    useStudioStore.setState({ document: createEmptyDocument(), selectedId: "warehouse-root", scopeId: "warehouse-root", past: [], future: [] })
  })

  it("blocks invalid hierarchy additions without mutating the document", () => {
    const before = Object.keys(useStudioStore.getState().document.nodes)
    const created = useStudioStore.getState().addNode("rack", "warehouse-root")

    expect(created).toBeNull()
    expect(Object.keys(useStudioStore.getState().document.nodes)).toEqual(before)
    expect(useStudioStore.getState().notice?.tone).toBe("error")
  })

  it("adds a valid hall, stays on the parent for another add, then undoes and redoes", () => {
    const id = useStudioStore.getState().addNode("hall", "warehouse-root")
    expect(id).toBeTruthy()
    expect(useStudioStore.getState().selectedId).toBe("warehouse-root")

    useStudioStore.getState().undo()
    expect(id && useStudioStore.getState().document.nodes[id]).toBeUndefined()

    useStudioStore.getState().redo()
    expect(id && useStudioStore.getState().document.nodes[id]).toBeDefined()
  })

  it("keeps the shelf selected after adding a bin so Add Bin stays available", () => {
    const hallId = useStudioStore.getState().addNode("hall", "warehouse-root")!
    const aisleId = useStudioStore.getState().addNode("aisle", hallId)!
    const rackId = useStudioStore.getState().addNode("rack", aisleId)!
    const shelfId = useStudioStore.getState().addNode("shelf", rackId)!
    useStudioStore.getState().selectNode(shelfId)

    const binId = useStudioStore.getState().addNode("bin", shelfId)
    expect(binId).toBeTruthy()
    expect(useStudioStore.getState().selectedId).toBe(shelfId)
  })

  it("creates vertical and horizontal aisles with orientation metadata", () => {
    const hallId = useStudioStore.getState().addNode("hall", "warehouse-root")!
    const verticalId = useStudioStore.getState().addNode("aisle", hallId, undefined, { aisleOrientation: "vertical" })!
    const horizontalId = useStudioStore.getState().addNode("aisle", hallId, undefined, { aisleOrientation: "horizontal" })!
    const nodes = useStudioStore.getState().document.nodes
    expect(nodes[verticalId].aisleOrientation).toBe("vertical")
    expect(nodes[horizontalId].aisleOrientation).toBe("horizontal")
    expect(useStudioStore.getState().selectedId).toBe(hallId)
  })

  it("deleting a container cascades through its descendants", () => {
    const hallId = useStudioStore.getState().addNode("hall", "warehouse-root")!
    const aisleId = useStudioStore.getState().addNode("aisle", hallId)!
    const rackId = useStudioStore.getState().addNode("rack", aisleId)!

    useStudioStore.getState().deleteNode(hallId)
    const nodes = useStudioStore.getState().document.nodes
    expect(nodes[hallId]).toBeUndefined()
    expect(nodes[aisleId]).toBeUndefined()
    expect(nodes[rackId]).toBeUndefined()
  })

  it("returns to the parent after deleting the open visual scope", () => {
    const hallId = useStudioStore.getState().addNode("hall", "warehouse-root")!
    const aisleId = useStudioStore.getState().addNode("aisle", hallId)!
    useStudioStore.getState().setScope(aisleId)

    useStudioStore.getState().deleteNode(aisleId)

    expect(useStudioStore.getState().scopeId).toBe(hallId)
    expect(useStudioStore.getState().selectedId).toBe(hallId)
  })

  it("keeps dimension edits contained inside the parent", () => {
    const hallId = useStudioStore.getState().addNode("hall", "warehouse-root")!
    const aisleId = useStudioStore.getState().addNode("aisle", hallId)!

    useStudioStore.getState().updateNode(aisleId, { x: 90, y: 260, width: 500, depth: 500 })

    const state = useStudioStore.getState()
    const hall = state.document.nodes[hallId]
    const aisle = state.document.nodes[aisleId]
    expect(aisle.width).toBe(hall.width)
    expect(aisle.depth).toBe(hall.depth)
    expect(aisle.x).toBe(0)
    expect(aisle.y).toBe(0)
  })

  it("stores global and per-field measurement choices", () => {
    useStudioStore.getState().setMeasurementMode("manual")
    useStudioStore.getState().setGlobalUnit("m")
    useStudioStore.getState().setFieldUnit("warehouse-root.width", "in")

    expect(useStudioStore.getState().measurementMode).toBe("manual")
    expect(useStudioStore.getState().globalUnit).toBe("m")
    expect(useStudioStore.getState().fieldUnits["warehouse-root.width"]).toBe("in")
  })

  it("generates three contained halls from the building controls", () => {
    useStudioStore.getState().generateHalls(3, 12)
    const state = useStudioStore.getState()
    const warehouse = state.document.nodes[state.document.rootId]
    const halls = Object.values(state.document.nodes).filter((node) => node.type === "hall")

    expect(halls).toHaveLength(3)
    expect(halls.every((hall) => hall.x >= 0 && hall.x + hall.width <= warehouse.width)).toBe(true)
  })

  it("generates a complete aisle-to-bin hierarchy inside a hall", () => {
    useStudioStore.getState().generateHalls(3, 12)
    const hall = Object.values(useStudioStore.getState().document.nodes).find((node) => node.type === "hall")!
    useStudioStore.getState().generateStorageLayout(hall.id, { aisles: 3, racks: 3, shelves: 4, bins: 6 })
    const descendants = Object.values(useStudioStore.getState().document.nodes).filter((node) => node.id !== hall.id)

    expect(descendants.filter((node) => node.type === "aisle")).toHaveLength(3)
    expect(descendants.filter((node) => node.type === "rack")).toHaveLength(9)
    expect(descendants.filter((node) => node.type === "shelf")).toHaveLength(36)
    expect(descendants.filter((node) => node.type === "bin")).toHaveLength(216)
  })

  it("allows shutter and gate under the warehouse root", () => {
    const shutterId = useStudioStore.getState().addNode("shutter", "warehouse-root")
    const gateId = useStudioStore.getState().addNode("gate", "warehouse-root")
    expect(shutterId).toBeTruthy()
    expect(gateId).toBeTruthy()
    expect(useStudioStore.getState().document.nodes[shutterId!].parentId).toBe("warehouse-root")
    expect(useStudioStore.getState().selectedId).toBe("warehouse-root")
  })
})
