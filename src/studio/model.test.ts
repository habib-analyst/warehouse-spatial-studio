import { describe, expect, it } from "vitest"
import { ALLOWED_CHILDREN, canParent, componentPathCodes, createEmptyDocument, createNode, fullComponentId, nextCode } from "./model"

describe("warehouse hierarchy model", () => {
  it("starts with one empty warehouse and no sample contents", () => {
    const document = createEmptyDocument()

    expect(document.rootId).toBe("warehouse-root")
    expect(Object.keys(document.nodes)).toEqual(["warehouse-root"])
    expect(document.nodes[document.rootId]).toMatchObject({ type: "warehouse", width: 280, depth: 420 })
  })

  it("allows only the approved parent-child hierarchy", () => {
    expect(ALLOWED_CHILDREN.warehouse).toEqual(["hall", "room", "openStore", "gate", "shutter"])
    expect(canParent("warehouse", "shutter")).toBe(true)
    expect(canParent("warehouse", "gate")).toBe(true)
    expect(canParent("hall", "aisle")).toBe(true)
    expect(canParent("hall", "rack")).toBe(true)
    expect(canParent("room", "openStore")).toBe(true)
    expect(canParent("hall", "zone")).toBe(true)
    expect(canParent("aisle", "rack")).toBe(true)
    expect(canParent("rack", "shelf")).toBe(true)
    expect(canParent("shelf", "bin")).toBe(true)
    expect(canParent("warehouse", "rack")).toBe(false)
    expect(canParent("hall", "bin")).toBe(false)
    expect(canParent("bin", "shelf")).toBe(false)
  })

  it("generates stable type codes and a centered child", () => {
    const document = createEmptyDocument()
    document.nodes.h1 = { ...createNode("hall", "warehouse-root", document), id: "h1", code: "HL01" }
    const code = nextCode("hall", document)
    const hall = createNode("hall", "warehouse-root", document)

    expect(code).toBe("HL02")
    expect(hall).toMatchObject({ type: "hall", parentId: "warehouse-root", code: "HL02" })
    expect(hall.x).toBeGreaterThanOrEqual(0)
    expect(hall.y).toBeGreaterThanOrEqual(0)
  })

  it("builds full component id from warehouse to leaf", () => {
    const document = createEmptyDocument()
    document.nodes.h1 = { ...createNode("hall", "warehouse-root", document), id: "h1", code: "HL01" }
    document.nodes.a1 = { ...createNode("aisle", "h1", document), id: "a1", code: "AH01", parentId: "h1" }
    expect(fullComponentId(document, "a1")).toBe("WH04-HL01-AH01")
    expect(componentPathCodes(document, "a1")).toEqual(["WH04", "HL01", "AH01"])
  })
})
