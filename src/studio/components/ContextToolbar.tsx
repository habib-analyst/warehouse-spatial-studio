import { Box, Check, DoorOpen, Grid2X2, Hash, Layers3, MousePointer2, PanelTopOpen, Route, Scaling, Tags, Undo2, Redo2, RotateCcw, Expand } from "lucide-react"
import type { NodeType } from "../model"
import { useStudioStore } from "../store"



export function ContextToolbar() {
  const { studioMode, tool, setTool, toggles, toggle, addNode, requestFit, viewMode, setViewMode, resetWarehouse, undo, redo, past, future } = useStudioStore()
  const fullscreen = () => {
    const element = globalThis.document?.querySelector<HTMLElement>(".studio-card")
    if (element?.requestFullscreen) void element.requestFullscreen()
  }
  return (
    <div className="context-toolbar">
      <div className="toolbar-cluster">
        <button className={tool === "select" ? "tool-button active" : "tool-button"} onClick={() => setTool("select")}><MousePointer2 size={14} />Select</button>
        <button className={tool === "pan" ? "tool-button active" : "tool-button"} onClick={() => setTool("pan")}><Scaling size={14} />Pan</button>
      </div>

      <div className="toolbar-separator" />
      <div className="toolbar-cluster toggle-tools">
        {([
          ["snap", "Snap", Hash],
          ["grid", "Grid", Grid2X2],
          ["dimensions", "Dimensions", Scaling],
          ["labels", "Labels", Tags],
          [studioMode === "layout" ? "routes" : "faces", studioMode === "layout" ? "Routes" : "Faces", studioMode === "layout" ? Route : Layers3],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} className={`toggle-button ${toggles[key] ? "on" : ""}`} onClick={() => toggle(key)}><span className="tiny-check">{toggles[key] && <Check size={10} />}</span><Icon size={13} />{label}</button>
        ))}
      </div>
      <div className="toolbar-spacer" />
      <div className="toolbar-cluster">
        <button className="tool-button" aria-label="Undo" disabled={!past.length} onClick={undo}><Undo2 size={14} />Undo</button>
        <button className="tool-button" aria-label="Redo" disabled={!future.length} onClick={redo}><Redo2 size={14} />Redo</button>
        <button className="tool-button danger-tool" aria-label="Reset warehouse" onClick={() => { if (window.confirm("Clear the warehouse and start from scratch?")) resetWarehouse() }}><RotateCcw size={14} />Reset</button>
        <div className="toolbar-separator" />
        <div className="segmented view-switch">
          <button className={viewMode === "2d" ? "active strong" : ""} aria-label="2D view" onClick={() => setViewMode("2d")}>2D</button>
          <button className={viewMode === "3d" ? "active strong" : ""} aria-label="3D view" onClick={() => setViewMode("3d")}><Box size={14} />3D</button>
        </div>
        <div className="toolbar-separator" />
        <button className="tool-button" aria-label="Fit canvas" onClick={requestFit}><Scaling size={14} />Fit</button>
        <button className="tool-button" aria-label="Fullscreen" onClick={fullscreen}><Expand size={14} />Full</button>
      </div>
    </div>
  )
}
