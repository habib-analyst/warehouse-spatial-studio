import { childrenOf, type NodeType, type StudioDocument } from "../model"

export type ProjectionKind = "floor" | "aisle-detail" | "rack-elevation" | "shelf-detail" | "bin-detail"
export type ProjectedNode = { id: string; x: number; y: number; width: number; depth: number; label: string; realSize: string }
export type ScopeProjection = { kind: ProjectionKind; width: number; depth: number; nodes: ProjectedNode[]; scaleNote: string }

export function projectionKind(type: NodeType): ProjectionKind {
  if (type === "warehouse" || type === "hall" || type === "room") return "floor"
  if (type === "aisle") return "aisle-detail"
  if (type === "rack") return "rack-elevation"
  if (type === "shelf") return "shelf-detail"
  return "bin-detail"
}

function shortCode(code: string) {
  return code.split("-").at(-1) ?? code
}

export function projectScope(document: StudioDocument, scopeId: string): ScopeProjection {
  const scope = document.nodes[scopeId] ?? document.nodes[document.rootId]
  const kind = projectionKind(scope.type)
  const children = childrenOf(document, scope.id).sort((a, b) => a.y - b.y || a.x - b.x || a.code.localeCompare(b.code))
  if (kind === "floor" || kind === "aisle-detail") {
    return {
      kind,
      width: scope.width,
      depth: scope.depth,
      nodes: children.map((node) => ({ id: node.id, x: node.x, y: node.y, width: node.width, depth: node.depth, label: shortCode(node.code), realSize: `${node.width} × ${node.depth} ft` })),
      scaleNote: "Physical floor-plan scale",
    }
  }
  if (kind === "rack-elevation") {
    return {
      kind, width: 100, depth: 70,
      nodes: children.map((node, index) => ({ id: node.id, x: 6, y: 51 - index * 12, width: 88, depth: 8, label: shortCode(node.code), realSize: `${node.width} × ${node.depth} × ${node.height} ft` })),
      scaleNote: "Front elevation · not floor-plan scale",
    }
  }
  if (kind === "shelf-detail") {
    const gap = 2
    const cellWidth = children.length ? (92 - gap * (children.length - 1)) / children.length : 92
    return {
      kind, width: 100, depth: 70,
      nodes: children.map((node, index) => ({ id: node.id, x: 4 + index * (cellWidth + gap), y: 18, width: cellWidth, depth: 34, label: shortCode(node.code), realSize: `${node.width} × ${node.depth} × ${node.height} ft` })),
      scaleNote: "Shelf compartment detail · cells enlarged for readability",
    }
  }
  return { kind, width: 100, depth: 70, nodes: [], scaleNote: "Trackable bin detail" }
}
