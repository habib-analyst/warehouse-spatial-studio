import { Copy, LockKeyhole, Trash2, UnlockKeyhole, X } from "lucide-react"
import { ancestorsOf, fullComponentId, NODE_LABELS, type StudioNode } from "../model"
import { useStudioStore } from "../store"
import { MeasurementField } from "./MeasurementField"

function Numeric({ label, field, node }: { label: string; field: keyof StudioNode; node: StudioNode }) {
  const updateNode = useStudioStore((state) => state.updateNode)
  return <MeasurementField label={label} fieldKey={`${node.id}.${String(field)}`} valueFeet={Number(node[field])} onChangeFeet={(value) => updateNode(node.id, { [field]: value })} />
}

export function PropertiesPanel() {
  const { document, selectedId, updateNode, duplicateNode, deleteNode, selectNode, setRightTab } = useStudioStore()
  const node = document.nodes[selectedId] ?? document.nodes[document.rootId]
  const path = ancestorsOf(document, node.id).map((item) => item.code).join(" › ")
  const title = `${NODE_LABELS[node.type]} properties`
  return (
    <section className="properties-panel">
      <header>
        <div><h2>{title}</h2><p>Selected <strong>{node.code}</strong></p></div>
        <button className="icon-button" aria-label="Close properties" onClick={() => setRightTab("closed")}><X size={15} /></button>
      </header>
      <div className="property-scroll">
        <p className="property-path">{path}</p>
        <label className="field full"><span>Display name</span><input value={node.name} onChange={(event) => updateNode(node.id, { name: event.target.value })} /></label>
        <label className="field full"><span>Component ID</span><input className="code-input" value={fullComponentId(document, node.id)} readOnly /></label>
        <label className="field full"><span>Code</span><input className="code-input" value={node.code} disabled={node.type === "warehouse"} onChange={(event) => updateNode(node.id, { code: event.target.value.toUpperCase() })} /></label>
        <div className="property-section"><h3>Dimensions</h3><div className="field-grid three"><Numeric label="Width" field="width" node={node} /><Numeric label="Depth" field="depth" node={node} /><Numeric label="Height" field="height" node={node} /></div></div>
        <div className="property-section"><h3>Position</h3><div className="field-grid two"><Numeric label="X" field="x" node={node} /><Numeric label="Y" field="y" node={node} /></div><label className="field full"><span>Rotation</span><select value={node.rotation} onChange={(event) => updateNode(node.id, { rotation: Number(event.target.value) })}><option value={0}>0°</option><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option></select></label></div>
        {node.type === "aisle" && <div className="property-section"><h3>Aisle orientation</h3><label className="field full"><span>Layout</span><select value={node.aisleOrientation ?? "vertical"} onChange={(event) => updateNode(node.id, { aisleOrientation: event.target.value as "vertical" | "horizontal" })}><option value="vertical">Vertical (racks top → bottom)</option><option value="horizontal">Horizontal (racks left → right)</option></select></label></div>}
        {node.type === "rack" && <div className="property-section"><h3>Storage</h3><div className="field-grid two"><label className="field"><span>Shelves</span><input type="number" value={node.shelves ?? 6} onChange={(event) => updateNode(node.id, { shelves: Number(event.target.value) })} /></label><label className="field"><span>Bins / shelf</span><input type="number" value={node.binsPerShelf ?? 10} onChange={(event) => updateNode(node.id, { binsPerShelf: Number(event.target.value) })} /></label></div><div className="capacity-card"><span>Capacity</span><strong>{(node.faces ?? 2) * (node.shelves ?? 6) * (node.binsPerShelf ?? 10)} bins</strong></div></div>}
        {node.type === "zone" && <div className="property-section"><h3>Zone configuration</h3><label className="field full"><span>Type</span><select value={node.zoneKind ?? node.name} onChange={(event) => updateNode(node.id, { zoneKind: event.target.value })}>{["Receiving","Sorting","Staging","Quality Control","Quarantine","Returns","Dispatch","Office"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="field full"><span>Purpose</span><input value={node.purpose ?? "General operations"} onChange={(event) => updateNode(node.id, { purpose: event.target.value })} /></label><div className="field-grid two"><label className="field"><span>Capacity</span><input type="number" value={node.capacity ?? 24} onChange={(event) => updateNode(node.id, { capacity: Number(event.target.value) })} /></label><label className="field"><span>Team</span><select value={node.team ?? "Operations"} onChange={(event) => updateNode(node.id, { team: event.target.value })}><option>Operations</option><option>Inbound</option><option>Outbound</option><option>Quality</option></select></label></div><label className="field full color-field"><span>Color</span><input type="color" value={node.color ?? "#06b6d4"} onChange={(event) => updateNode(node.id, { color: event.target.value })} /></label></div>}
        <button className={`lock-row ${node.locked ? "locked" : ""}`} onClick={() => updateNode(node.id, { locked: !node.locked })}>{node.locked ? <LockKeyhole size={15} /> : <UnlockKeyhole size={15} />}<span><strong>{node.locked ? "Position locked" : "Lock position"}</strong><small>{node.locked ? "Unlock to move or resize" : "Prevent accidental canvas changes"}</small></span></button>
      </div>
      <footer><button disabled={node.type === "warehouse"} onClick={() => duplicateNode(node.id)}><Copy size={14} />Duplicate</button><button className="danger" disabled={node.type === "warehouse"} onClick={() => deleteNode(node.id)}><Trash2 size={14} />Delete</button></footer>
    </section>
  )
}
