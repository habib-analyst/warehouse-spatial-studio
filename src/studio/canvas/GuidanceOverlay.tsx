import { ArrowLeft, Box, ChevronRight, Plus, Ruler } from "lucide-react"
import { ALLOWED_CHILDREN, ancestorsOf, childrenOf, NODE_LABELS, type NodeType } from "../model"
import { useStudioStore } from "../store"
import type { ScopeProjection } from "./visualProjection"

const OPENABLE = new Set<NodeType>(["warehouse", "hall", "room", "aisle", "rack", "shelf"])

export function GuidanceOverlay({ projection }: { projection: ScopeProjection }) {
  const { document, scopeId, addNode, setScope, updateNode } = useStudioStore()
  const scope = document.nodes[scopeId]
  const path = ancestorsOf(document, scopeId)
  const parent = path.length > 1 ? path[path.length - 2] : null
  const allowed = ALLOWED_CHILDREN[scope.type]
  const childCount = childrenOf(document, scope.id).length
  const firstLabel = scope.type === "warehouse" ? "Add first hall" : `Add first ${NODE_LABELS[allowed[0]]?.toLowerCase() ?? "component"}`

  const add = (type: NodeType, options?: { aisleOrientation?: "vertical" | "horizontal" }) => addNode(type, scope.id, undefined, options)
  return <>
    <div className="canvas-guide-top">
      <div className="canvas-crumbs" aria-label="Canvas location path">
        {path.map((node, index) => <span key={node.id}>{node.code}{index < path.length - 1 && <ChevronRight size={11} />}</span>)}
      </div>
      <div className="canvas-scale-note"><Ruler size={13} />{projection.scaleNote}</div>
    </div>
    {parent && <button className="canvas-back" aria-label={`Canvas back to ${parent.code}`} onClick={() => setScope(parent.id)}><ArrowLeft size={14} />Back to {parent.code}</button>}
    <div className="canvas-actions" aria-label={`Add components to ${scope.code}`}>
      <span><Box size={13} />Add to {scope.code}</span>
      {allowed.map((type) => type === "aisle" ? (
        <span key="aisle-pair" className="aisle-add-pair">
          <button aria-label="Add Vertical Aisle" onClick={() => add("aisle", { aisleOrientation: "vertical" })}><Plus size={12} />Vertical aisle</button>
          <button aria-label="Add Horizontal Aisle" onClick={() => add("aisle", { aisleOrientation: "horizontal" })}><Plus size={12} />Horizontal aisle</button>
        </span>
      ) : (
        <button key={type} aria-label={`Add ${NODE_LABELS[type]}`} onClick={() => add(type)}><Plus size={12} />{NODE_LABELS[type]}</button>
      ))}
    </div>
    <div className="canvas-size-editor" aria-label={`${scope.code} dimensions`}>
      <strong>{scope.code} size</strong>
      <label>W <input aria-label="Canvas width" type="number" value={scope.width} onChange={(event) => updateNode(scope.id, { width: Number(event.target.value) })} /><b>ft</b></label>
      <label>D <input aria-label="Canvas depth" type="number" value={scope.depth} onChange={(event) => updateNode(scope.id, { depth: Number(event.target.value) })} /><b>ft</b></label>
      <label>H <input aria-label="Canvas height" type="number" value={scope.height} onChange={(event) => updateNode(scope.id, { height: Number(event.target.value) })} /><b>ft</b></label>
    </div>
    {!childCount && allowed.length > 0 && <div className="canvas-empty-guide">
      <div className="empty-guide-icon"><Plus size={22} /></div>
      <strong>{scope.type === "warehouse" ? "Start your warehouse layout" : `${scope.code} is ready for its first ${NODE_LABELS[allowed[0]].toLowerCase()}`}</strong>
      <p>Add components here. The canvas will place each item in the next valid free position.</p>
      <button aria-label={firstLabel} onClick={() => add(allowed[0], allowed[0] === "aisle" ? { aisleOrientation: "vertical" } : undefined)}><Plus size={14} />{firstLabel}</button>
    </div>}
    {!allowed.length && !OPENABLE.has(scope.type) && <div className="canvas-empty-guide bin-detail-card"><strong>{scope.code}</strong><p>Trackable inventory location</p></div>}
  </>
}
