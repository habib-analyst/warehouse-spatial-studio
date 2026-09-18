import { describe, expect, it } from "vitest"
import { createSampleDocument } from "../sample"
import { nodeSceneTransform } from "./sceneGeometry"

describe("3D scene mapping", () => {
  it("centers hall plan coordinates inside the warehouse scene", () => {
    const document = createSampleDocument()
    expect(nodeSceneTransform(document, "sample-hall-1", document.rootId)).toEqual({
      position: [-84, 13, 0],
      scale: [72, 26, 286],
    })
  })

  it("maps nested rack coordinates through all parent offsets", () => {
    const document = createSampleDocument()
    const transform = nodeSceneTransform(document, "sample-h1-a1-rack-1", document.rootId)
    expect(transform.position[0]).toBe(-108)
    expect(transform.position[1]).toBe(6)
    expect(transform.position[2]).toBe(-104)
    expect(transform.scale).toEqual([12, 12, 42])
  })

  it("elevates shelves inside their rack instead of placing them on the floor", () => {
    const document = createSampleDocument()
    const first = nodeSceneTransform(document, "sample-h1-a1-rack-1-shelf-1", document.rootId)
    const third = nodeSceneTransform(document, "sample-h1-a1-rack-1-shelf-3", document.rootId)
    expect(first.position[1]).toBeGreaterThan(0)
    expect(third.position[1]).toBeGreaterThan(first.position[1])
  })
})
