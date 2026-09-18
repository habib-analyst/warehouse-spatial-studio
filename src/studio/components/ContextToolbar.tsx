import { Box, Check, DoorOpen, Grid2X2, Hash, Layers3, MousePointer2, PanelTopOpen, Route, Scaling, Tags } from "lucide-react"
import type { NodeType } from "../model"
import { useStudioStore } from "../store"

type ToolItem = { type: NodeType; label: string; icon: typeof Box; aisleOrientation?: "vertical" | "horizontal" }

const TOOLS: Record<string, ToolItem[]> = {
  building: [
    { type: "hall", label: "Add Hall", icon: Box },
    { type: "room", label: "Add Room", icon: Layers3 },
    { type: "openStore", label: "Add Open Store", icon: Grid2X2 },
    { type: "gate", label: "Add Gate", icon: DoorOpen },
    { type: "shutter", label: "Add Shutter", icon: DoorOpen },
  ],
  storage: [
    { type: "aisle", label: "Vertical Aisle", icon: Route, aisleOrientation: "vertical" },
    { type: "aisle", label: "Horizontal Aisle", icon: Route, aisleOrientation: "horizontal" },
    { type: "rack", label: "Add Rack", icon: PanelTopOpen },
    { type: "shelf", label: "Add Shelf", icon: Layers3 },
    { type: "bin", label: "Add Bin", icon: Box },
  ],
  layout: [
    { type: "zone", label: "Add Zone", icon: Box },
    { type: "openStore", label: "Add Open Store", icon: Grid2X2 },
    { type: "shutter", label: "Add Shutter", icon: DoorOpen },
    { type: "gate", label: "Add Gate", icon: DoorOpen },
  ],
}

export function ContextToolbar() {
  const { studioMode, tool, setTool, toggles, toggle, addNode, requestFit } = useStudioStore()
  return (
    <div className="context-toolbar">
      <div className="toolbar-cluster">
        <button className={tool === "select" ? "tool-button active" : "tool-button"} onClick={() => setTool("select")}><MousePointer2 size={14} />Select</button>
        <button className={tool === "pan" ? "tool-button active" : "tool-button"} onClick={() => setTool("pan")}><Scaling size={14} />Pan</button>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-cluster add-tools">
        {TOOLS[studioMode].map(({ type, label, icon: Icon, aisleOrientation }) => (
          <button
            key={`${type}-${aisleOrientation ?? label}`}
            className="tool-button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-sanwa-studio-node", type)
              if (aisleOrientation) event.dataTransfer.setData("application/x-sanwa-aisle-orientation", aisleOrientation)
            }}
            onClick={() => addNode(type, undefined, undefined, aisleOrientation ? { aisleOrientation } : undefined)}
            aria-label={label}
          >
            <Icon size={14} />{label}
          </button>
        ))}
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
        <button className="tool-button" aria-label="Fit canvas" onClick={requestFit}><Scaling size={14} />Fit</button>
      </div>
    </div>
  )
}
