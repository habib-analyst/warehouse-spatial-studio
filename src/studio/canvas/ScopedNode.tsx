import type { StudioNode } from "../model"
import type { ProjectedNode, ProjectionKind } from "./visualProjection"

const COLORS: Record<StudioNode["type"], { fill: string; stroke: string }> = {
  warehouse:{fill:"#f8fbff",stroke:"#385775"}, hall:{fill:"#eaf3ff",stroke:"#4388e8"}, room:{fill:"#eef2f7",stroke:"#64748b"},
  aisle:{fill:"#f7fbff",stroke:"#73a6df"}, rack:{fill:"#e9eef3",stroke:"#40556d"}, shelf:{fill:"#dbeafe",stroke:"#2772d3"},
  bin:{fill:"#ede9fe",stroke:"#7c3aed"}, openStore:{fill:"#e0f2fe",stroke:"#0ea5e9"}, zone:{fill:"#ecfeff",stroke:"#06b6d4"},
  gate:{fill:"#dcfce7",stroke:"#16a34a"}, shutter:{fill:"#cffafe",stroke:"#0891b2"},
}

export function ScopedNode({ projected, node, kind, selected, onOpen }: { projected: ProjectedNode; node: StudioNode; kind: ProjectionKind; selected: boolean; onOpen: () => void }) {
  const color = COLORS[node.type]
  const isAisle = node.type === "aisle"
  const labelY = projected.y + projected.depth / 2
  return <g role="button" tabIndex={0} aria-label={`Open ${projected.label} ${node.name}`} className={`scoped-node type-${node.type} ${selected ? "selected" : ""}`} onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen() }}>
    <rect x={projected.x} y={projected.y} width={projected.width} height={projected.depth} rx={kind.includes("detail") ? 1.8 : .8} fill={color.fill} stroke={selected ? "#1677ff" : color.stroke} strokeWidth={selected ? 1.3 : .75} strokeDasharray={isAisle ? "3 2" : undefined} />
    {isAisle && <><line x1={projected.x + projected.width / 2} y1={projected.y + 4} x2={projected.x + projected.width / 2} y2={projected.y + projected.depth - 4} stroke="#8eb5e0" strokeWidth=".55" strokeDasharray="4 3" /><path d={`M ${projected.x + projected.width / 2 - 1.5} ${projected.y + 8} l 1.5 -2 1.5 2`} fill="none" stroke="#4388e8" strokeWidth=".6" /></>}
    {node.type === "rack" && kind === "aisle-detail" && <line x1={projected.x + 1} y1={projected.y + 2} x2={projected.x + projected.width - 1} y2={projected.y + 2} stroke="#7890a8" strokeWidth=".5" />}
    <text x={projected.x + projected.width / 2} y={labelY - 1} textAnchor="middle" dominantBaseline="middle" className="scoped-code">{projected.label}</text>
    <text x={projected.x + projected.width / 2} y={labelY + 4} textAnchor="middle" dominantBaseline="middle" className="scoped-size">{projected.realSize}</text>
  </g>
}
