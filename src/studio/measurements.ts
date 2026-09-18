export type MeasurementUnit = "mm" | "cm" | "m" | "in" | "ft"
export type MeasurementMode = "global" | "manual"

export const MEASUREMENT_UNITS: MeasurementUnit[] = ["mm", "cm", "m", "in", "ft"]

const FEET_PER_UNIT: Record<MeasurementUnit, number> = {
  mm: 1 / 304.8,
  cm: 1 / 30.48,
  m: 3.280839895,
  in: 1 / 12,
  ft: 1,
}

export function convertToFeet(value: number, unit: MeasurementUnit) {
  return value * FEET_PER_UNIT[unit]
}

export function convertFromFeet(value: number, unit: MeasurementUnit) {
  return value / FEET_PER_UNIT[unit]
}

export function formatMeasurement(valueFeet: number, unit: MeasurementUnit) {
  const converted = convertFromFeet(valueFeet, unit)
  return Number(converted.toFixed(unit === "mm" ? 1 : unit === "cm" ? 2 : 3)).toString()
}
