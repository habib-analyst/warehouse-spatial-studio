import { describe, expect, it } from "vitest"
import { convertFromFeet, convertToFeet, formatMeasurement } from "./measurements"

describe("measurement conversion", () => {
  it("round-trips supported warehouse units through canonical feet", () => {
    expect(convertToFeet(12, "in")).toBeCloseTo(1)
    expect(convertFromFeet(1, "in")).toBeCloseTo(12)
    expect(convertToFeet(1, "m")).toBeCloseTo(3.28084, 5)
    expect(convertFromFeet(1, "cm")).toBeCloseTo(30.48, 5)
    expect(convertFromFeet(1, "mm")).toBeCloseTo(304.8, 5)
  })

  it("formats converted values without noisy floating point tails", () => {
    expect(formatMeasurement(12, "ft")).toBe("12")
    expect(formatMeasurement(1, "m")).toBe("0.305")
    expect(formatMeasurement(1, "in")).toBe("12")
  })
})
