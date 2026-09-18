import { ancestorsOf } from "../model"
import { useStudioStore } from "../store"
import { GuidanceOverlay } from "./GuidanceOverlay"
import { ScopedNode } from "./ScopedNode"
import { projectScope } from "./visualProjection"

const OPENABLE = new Set(["hall", "room", "aisle", "rack", "shelf"])

export function GuidedCanvas() {
  const { document, scopeId, selectedId, selectNode, setScope } = useStudioStore()
  const scope = document.nodes[scopeId] ?? document.nodes[document.rootId]
  const projection = projectScope(document, scope.id)
  const path = ancestorsOf(document, scope.id).map((node) => node.code).join(" / ")
  const open = (id: string) => {
    const node = document.nodes[id]
    selectNode(id)
    if (OPENABLE.has(node.type)) setScope(id)
  }
  return <section className={`guided-canvas projection-${projection.kind}`} aria-label="Guided warehouse canvas">
    <GuidanceOverlay projection={projection} />
    <div className="guided-drawing">
      <svg viewBox={`-10 -12 ${projection.width + 20} ${projection.depth + 28}`} role="img" aria-label={`${scope.code} ${projection.kind} visual`} preserveAspectRatio="xMidYMid meet">
        <defs><pattern id="minorGrid" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M 4 0 L 0 0 0 4" fill="none" stroke="#e9f0f8" strokeWidth=".25" /></pattern></defs>
        <rect x="0" y="0" width={projection.width} height={projection.depth} fill="url(#minorGrid)" stroke="#314b69" strokeWidth="1" />
        {projection.kind === "aisle-detail" && <rect x={projection.width * .36} y="3" width={projection.width * .28} height={projection.depth - 6} fill="#fff" stroke="#9ebddd" strokeDasharray="4 3" strokeWidth=".6" />}
        {projection.kind === "rack-elevation" && <><line x1="5" y1="4" x2="5" y2="62" stroke="#344d68" strokeWidth="2" /><line x1="95" y1="4" x2="95" y2="62" stroke="#344d68" strokeWidth="2" /><line x1="3" y1="62" x2="97" y2="62" stroke="#344d68" strokeWidth="2.5" /></>}
        {projection.nodes.map((projected) => <ScopedNode key={projected.id} projected={projected} node={document.nodes[projected.id]} kind={projection.kind} selected={selectedId === projected.id} onOpen={() => open(projected.id)} />)}
        <line x1="0" y1="-4" x2={projection.width} y2="-4" stroke="#3766a5" strokeWidth=".45" /><line x1="0" y1="-6" x2="0" y2="-2" stroke="#3766a5" strokeWidth=".45" /><line x1={projection.width} y1="-6" x2={projection.width} y2="-2" stroke="#3766a5" strokeWidth=".45" />
        <text x={projection.width / 2} y="-6" textAnchor="middle" className="canvas-dimension">{scope.width} ft</text>
        <text x={projection.width / 2} y={projection.depth + 8} textAnchor="middle" className="canvas-scope-label">{scope.code} · {scope.name}</text>
      </svg>
    </div>
    <div className="canvas-path-full">{path}</div>
    <span className="sr-only">{scope.width} × {scope.depth} ft</span>
  </section>
}
