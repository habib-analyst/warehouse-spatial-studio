import { convertToFeet, formatMeasurement, MEASUREMENT_UNITS, type MeasurementUnit } from "../measurements"
import { useStudioStore } from "../store"

type Props = {
  label: string
  fieldKey: string
  valueFeet: number | ""
  onChangeFeet: (value: number | "") => void
}

export function MeasurementField({ label, fieldKey, valueFeet, onChangeFeet }: Props) {
  const { measurementMode, globalUnit, fieldUnits, setFieldUnit } = useStudioStore()
  const unit = measurementMode === "manual" ? fieldUnits[fieldKey] ?? globalUnit : globalUnit
  return <label className="field measurement-field">
    <span>{label}</span>
    <div className={`measurement-input ${measurementMode}`}>
      <input
        aria-label={`${label} ${unit}`}
        type="number"
        min="0"
        step="any"
        value={valueFeet === "" ? "" : formatMeasurement(valueFeet, unit)}
        onChange={(event) => onChangeFeet(event.target.value === "" ? "" : Math.max(0, convertToFeet(Number(event.target.value), unit)))}
      />
      {measurementMode === "manual" ? (
        <select aria-label={`${label} unit`} value={unit} onChange={(event) => setFieldUnit(fieldKey, event.target.value as MeasurementUnit)}>
          {MEASUREMENT_UNITS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : <b>{unit}</b>}
    </div>
  </label>
}

export function MeasurementControls() {
  const { measurementMode, globalUnit, setMeasurementMode, setGlobalUnit } = useStudioStore()
  return <div className="measurement-controls-body">
    <div className="measurement-mode">
      <button className={measurementMode === "global" ? "active" : ""} onClick={() => setMeasurementMode("global")}>One unit</button>
      <button className={measurementMode === "manual" ? "active" : ""} onClick={() => setMeasurementMode("manual")}>Per field</button>
    </div>
    <select aria-label="Global measurement unit" value={globalUnit} onChange={(event) => setGlobalUnit(event.target.value as MeasurementUnit)}>
      {MEASUREMENT_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
    </select>
  </div>
}
