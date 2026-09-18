import { Box, Building2, DoorOpen, Grid2X2, Layers3, PackageOpen, PanelTopOpen, Plus, Route, Warehouse } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"
import { ancestorsOf, type NodeType, type StudioMode } from "../model"
import { useStudioStore } from "../store"
import { HierarchyTree } from "./HierarchyTree"
import { MeasurementControls, MeasurementField } from "./MeasurementField"

type PaletteItem = { type: NodeType; label: string; note: string; icon: LucideIcon; aisleOrientation?: "vertical" | "horizontal" }

const palette: Record<StudioMode, PaletteItem[]> = {
  building: [
    { type: "hall", label: "Hall", note: "Storage or processing hall", icon: Building2 },
    { type: "room", label: "Room", note: "Enclosed operational room", icon: Box },
    { type: "openStore", label: "Open Store", note: "Unpacked floor storage", icon: Grid2X2 },
    { type: "gate", label: "Gate", note: "Controlled personnel access", icon: DoorOpen },
    { type: "shutter", label: "Shutter", note: "Receiving or dispatch access", icon: DoorOpen },
  ],
  storage: [
    { type: "aisle", label: "Vertical aisle", note: "Racks stacked top → bottom", icon: Route, aisleOrientation: "vertical" },
    { type: "aisle", label: "Horizontal aisle", note: "Racks lined left → right", icon: Route, aisleOrientation: "horizontal" },
    { type: "rack", label: "Rack", note: "Double-face storage rack", icon: PanelTopOpen },
    { type: "shelf", label: "Shelf", note: "Rack level · 8 bins default", icon: Layers3 },
    { type: "bin", label: "Bin", note: "Addressable inventory bin", icon: PackageOpen },
  ],
  layout: [
    { type: "zone", label: "Zone", note: "Receiving, QC or dispatch", icon: Box },
    { type: "openStore", label: "Open Store", note: "Unpacked floor storage", icon: Grid2X2 },
    { type: "shutter", label: "Shutter", note: "Receiving or dispatch access", icon: DoorOpen },
    { type: "gate", label: "Gate", note: "Controlled personnel access", icon: DoorOpen },
  ],
}

function NumberField({ label, fieldKey, value, onChange }: { label: string; fieldKey: string; value: number; onChange: (value: number) => void }) {
  return <MeasurementField label={label} fieldKey={fieldKey} valueFeet={value} onChangeFeet={onChange} />
}

function BuildingFields() {
  const { document, updateNode, generateHalls } = useStudioStore()
  const [hallCount, setHallCount] = useState(3)
  const [hallGap, setHallGap] = useState(12)
  const root = document.nodes[document.rootId]
  return <>
    <Panel title="Building envelope" icon={Warehouse}>
      <div className="field-grid three"><NumberField label="Width" fieldKey={`${root.id}.width`} value={root.width} onChange={(width) => updateNode(root.id, { width })} /><NumberField label="Depth" fieldKey={`${root.id}.depth`} value={root.depth} onChange={(depth) => updateNode(root.id, { depth })} /><NumberField label="Clear height" fieldKey={`${root.id}.height`} value={root.height} onChange={(height) => updateNode(root.id, { height })} /></div>
      <div className="metrics-row"><span><small>Floor area</small><strong>{Math.round(root.width * root.depth).toLocaleString()} ft²</strong></span><span><small>Volume</small><strong>{Math.round(root.width * root.depth * root.height).toLocaleString()} ft³</strong></span><span><small>Usable area</small><strong>85%</strong></span></div>
    </Panel>
    <Panel title="Hall arrangement" icon={Grid2X2}>
      <div className="choice-row"><button className="choice active">Generate halls</button><button className="choice">Add manually</button></div>
      <div className="field-grid three"><label className="field"><span>Hall count</span><input type="number" min="1" max="8" value={hallCount} onChange={(event) => setHallCount(Number(event.target.value))} /></label><NumberField label="Hall gap" fieldKey="generator.hallGap" value={hallGap} onChange={setHallGap} /><label className="field"><span>Arrangement</span><select><option>Vertical split</option><option>Horizontal split</option><option>Grid</option></select></label></div>
      <button className="outline-action" onClick={() => generateHalls(hallCount, hallGap)}><Grid2X2 size={14} />Generate {hallCount} halls</button>
    </Panel>
  </>
}

function StorageFields() {
  const { document, selectedId, scopeId, generateStorageLayout } = useStudioStore()
  const [aisles, setAisles] = useState(3)
  const [racks, setRacks] = useState(3)
  const [shelves, setShelves] = useState(4)
  const [bins, setBins] = useState(6)
  const [rackWidth, setRackWidth] = useState(12)
  const [rackDepth, setRackDepth] = useState(42)
  const [rackHeight, setRackHeight] = useState(12)
  const [faces, setFaces] = useState<1 | 2>(2)
  const selectedPath = ancestorsOf(document, document.nodes[selectedId]?.id ?? scopeId)
  const hall = [...selectedPath].reverse().find((node) => node.type === "hall" || node.type === "room")
  return <>
    <Panel title="Rack template" icon={PanelTopOpen}>
      <label className="field full"><span>Template</span><select><option>Standard Auto Parts Rack</option><option>Heavy Duty Rack</option></select></label>
      <div className="field-grid three"><NumberField label="Width" fieldKey="template.rackWidth" value={rackWidth} onChange={setRackWidth} /><NumberField label="Depth" fieldKey="template.rackDepth" value={rackDepth} onChange={setRackDepth} /><NumberField label="Height" fieldKey="template.rackHeight" value={rackHeight} onChange={setRackHeight} /></div>
      <div className="choice-row"><button className={faces === 1 ? "choice active" : "choice"} onClick={() => setFaces(1)}>Single face</button><button className={faces === 2 ? "choice active" : "choice"} onClick={() => setFaces(2)}>Double face</button></div>
      <div className="field-grid two"><label className="field"><span>Shelves per face</span><input type="number" min="1" max="12" value={shelves} onChange={(event) => setShelves(Number(event.target.value))} /></label><label className="field"><span>Bins per shelf</span><input type="number" min="1" max="20" value={bins} onChange={(event) => setBins(Number(event.target.value))} /></label></div>
      <div className="formula-callout"><Box size={13} />{faces} {faces === 1 ? "face" : "faces"} × {shelves} shelves × {bins} bins = <strong>{faces * shelves * bins} bins per rack</strong></div>
    </Panel>
    <Panel title="Layout generator" icon={Grid2X2}>
      <div className="field-grid two"><label className="field"><span>Aisles</span><input type="number" min="1" max="8" value={aisles} onChange={(event) => setAisles(Number(event.target.value))} /></label><label className="field"><span>Racks / aisle</span><input type="number" min="1" max="12" value={racks} onChange={(event) => setRacks(Number(event.target.value))} /></label><label className="field"><span>Shelves / rack</span><input type="number" min="1" max="12" value={shelves} onChange={(event) => setShelves(Number(event.target.value))} /></label><label className="field"><span>Bins / shelf</span><input type="number" min="1" max="20" value={bins} onChange={(event) => setBins(Number(event.target.value))} /></label></div>
      <button className="outline-action" disabled={!hall} onClick={() => hall && generateStorageLayout(hall.id, { aisles, racks, shelves, bins, rackWidth, rackDepth, rackHeight, faces })}><Grid2X2 size={14} />{hall ? `Generate storage in ${hall.code}` : "Select a hall first"}</button>
    </Panel>
  </>
}

function LayoutFields() {
  const { addNode, updateNode } = useStudioStore()
  const zones = [["Receiving", "RCV01", "cyan", "#06b6d4"], ["Sorting", "SRT01", "orange", "#f59e0b"], ["Quality Control", "QC01", "violet", "#8b5cf6"], ["Quarantine", "QTN01", "red", "#f43f5e"], ["Returns", "RTN01", "purple", "#a855f7"], ["Dispatch", "DSP01", "teal", "#14b8a6"]]
  return <>
    <Panel title="Operational zones" icon={Grid2X2}>
      <div className="zone-grid">{zones.map(([name, code, color, hex]) => <button className="zone-card" key={code} onClick={() => { const id = addNode("zone"); if (id) updateNode(id, { name, code, color: hex, zoneKind: name, purpose: name === "Receiving" ? "Inbound inspection" : name, team: name === "Dispatch" ? "Outbound" : "Operations", capacity: 24 }) }}><span className={`zone-icon ${color}`}><Box size={15} /></span><span><strong>{name}</strong><small>{code}</small></span><i>Add</i></button>)}</div>
      <button className="outline-action"><Plus size={14} />Add operational zone</button>
    </Panel>
    <Panel title="Shutters & routes" icon={Route}>
      <p className="muted-copy">Place receiving, main-access and dispatch shutters, then connect safe inbound and outbound routes.</p>
      <div className="route-check"><span>Inbound route</span><b>Receiving → AV01</b></div><div className="route-check"><span>Outbound route</span><b>AV05 → Dispatch</b></div>
    </Panel>
  </>
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return <section className="config-panel"><header><Icon size={16} /><h3>{title}</h3><span>⌃</span></header><div className="config-body">{children}</div></section>
}

export function LibraryPanel() {
  const { studioMode, leftTab, setLeftTab, addNode, wizardStep } = useStudioStore()
  const stepTitle = wizardStep === 2 ? "Building" : wizardStep === 3 ? "Storage" : wizardStep === 4 ? "Layout" : "Design"
  return (
    <aside className="library-panel">
      <div className="sidebar-step-title"><strong>{stepTitle}</strong></div>
      <div className="subtabs"><button className={leftTab === "library" ? "active" : ""} onClick={() => setLeftTab("library")}>Design</button><button className={leftTab === "hierarchy" ? "active" : ""} onClick={() => setLeftTab("hierarchy")}>Hierarchy</button></div>
      <div className="panel-scroll">
        {leftTab === "hierarchy" ? <HierarchyTree /> : <>
          <MeasurementControls />
          {studioMode === "building" ? <BuildingFields /> : studioMode === "storage" ? <StorageFields /> : <LayoutFields />}
          <section className="config-panel component-library"><header><Box size={16} /><h3>Component library</h3><span>{palette[studioMode].length}</span></header><div className="palette-grid">{palette[studioMode].map(({ type, label, note, icon: Icon, aisleOrientation }) => <button key={`${type}-${aisleOrientation ?? label}`} aria-label={`Add ${label}`} draggable onDragStart={(event) => { event.dataTransfer.setData("application/x-sanwa-studio-node", type); if (aisleOrientation) event.dataTransfer.setData("application/x-sanwa-aisle-orientation", aisleOrientation) }} onClick={() => addNode(type, undefined, undefined, aisleOrientation ? { aisleOrientation } : undefined)}><Icon size={18} /><span><strong>{label}</strong><small>{note}</small></span><Plus size={14} /></button>)}</div></section>
        </>}
      </div>
    </aside>
  )
}
