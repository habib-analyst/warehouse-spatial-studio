import { Box, Expand, Redo2, RotateCcw, Undo2 } from "lucide-react"
import { componentPathCodes, fullComponentId } from "../model"
import { useStudioStore } from "../store"

export function StudioHeader() {
  const { document, selectedId, scopeId, viewMode, setViewMode, resetWarehouse, undo, redo, past, future } = useStudioStore()
  const focusId = selectedId || scopeId
  const pathCodes = componentPathCodes(document, focusId)
  const componentId = fullComponentId(document, focusId)
  const pathLabel = pathCodes.join(" › ")

  return (
    <header className="studio-header">
      <div className="studio-heading">
        <span className="studio-component-id" title={componentId}>{componentId}</span>
        <span className="studio-breadcrumb" title={pathLabel}>
          {pathLabel}
        </span>
      </div>
    </header>
  )
}
