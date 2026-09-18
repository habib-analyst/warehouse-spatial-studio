import { Box, Expand, Redo2, RotateCcw, Undo2 } from "lucide-react"
import { componentPathCodes, fullComponentId } from "../model"
import { useStudioStore } from "../store"

export function StudioHeader() {
  const { document, selectedId, scopeId, viewMode, setViewMode, resetWarehouse, undo, redo, past, future } = useStudioStore()
  const focusId = selectedId || scopeId
  const pathCodes = componentPathCodes(document, focusId)
  const componentId = fullComponentId(document, focusId)
  const pathLabel = pathCodes.join(" › ")

  const fullscreen = () => {
    const element = globalThis.document?.querySelector<HTMLElement>(".studio-card")
    if (element?.requestFullscreen) void element.requestFullscreen()
  }

  return (
    <header className="studio-header">
      <div className="studio-heading">
        <h1>Spatial Studio</h1>
        <span className="studio-component-id" title={componentId}>{componentId}</span>
        <span className="studio-breadcrumb" title={pathLabel}>
          {pathLabel}
          <em> · {viewMode === "2d" ? "Plan" : "Model"}</em>
        </span>
      </div>
      <div className="studio-header-actions">
        <button className="icon-button" aria-label="Undo" disabled={!past.length} onClick={undo}><Undo2 size={15} /></button>
        <button className="icon-button" aria-label="Redo" disabled={!future.length} onClick={redo}><Redo2 size={15} /></button>
        <button
          className="tool-button danger-tool"
          aria-label="Reset warehouse"
          onClick={() => {
            if (window.confirm("Clear the warehouse and start from scratch?")) resetWarehouse()
          }}
        >
          <RotateCcw size={14} />Reset
        </button>
        <div className="segmented view-switch">
          <button className={viewMode === "2d" ? "active strong" : ""} aria-label="2D view" onClick={() => setViewMode("2d")}>2D</button>
          <button className={viewMode === "3d" ? "active strong" : ""} aria-label="3D view" onClick={() => setViewMode("3d")}><Box size={14} />3D</button>
        </div>
        <button className="icon-button" aria-label="Fullscreen" onClick={fullscreen}><Expand size={16} /></button>
      </div>
    </header>
  )
}
