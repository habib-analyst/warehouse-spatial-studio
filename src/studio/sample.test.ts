import { describe, expect, it } from "vitest"
import { createSampleDocument } from "./sample"
import { ancestorsOf } from "./model"
import { validateDocument } from "./geometry"

describe("sample warehouse", () => {
  it("matches the review layout's main structure", () => {
    const document = createSampleDocument()
    const nodes = Object.values(document.nodes)
    const count = (type: string) => nodes.filter((node) => node.type === type).length

    expect(count("hall")).toBe(3)
    expect(count("aisle")).toBe(9)
    expect(count("rack")).toBe(27)
    expect(count("openStore")).toBe(1)
    expect(count("zone")).toBe(6)
    expect(count("shutter")).toBe(3)
    expect(count("shelf")).toBe(108)
    expect(count("bin")).toBe(648)
    expect(validateDocument(document).filter((issue) => issue.severity === "error")).toEqual([])

    const finalBin = nodes.find((node) => node.type === "bin" && node.code === "HL03-AV03-R03-S04-B06")!
    expect(ancestorsOf(document, finalBin.id).map((node) => node.type)).toEqual(["warehouse", "hall", "aisle", "rack", "shelf", "bin"])
  })
})
