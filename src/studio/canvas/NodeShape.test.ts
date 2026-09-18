import { describe, expect, it } from "vitest"
import { labelFontSize } from "./NodeShape"

describe("canvas labels", () => {
  it("keeps bin and shelf labels inside the component bounds", () => {
    const bin = { type: "bin" as const, width: 3.2, depth: 4, code: "BN01", name: "Bin" }
    const shelf = { type: "shelf" as const, width: 11, depth: 5, code: "SF01", name: "Shelf" }
    const binFont = labelFontSize(bin as never, 8, "BN01")
    const shelfFont = labelFontSize(shelf as never, 4, "SF01")
    expect(binFont).toBeLessThanOrEqual(3.2)
    expect(binFont).toBeGreaterThan(0.4)
    expect(shelfFont).toBeLessThanOrEqual(5)
    expect(shelfFont).toBeGreaterThan(0.5)
  })
})
