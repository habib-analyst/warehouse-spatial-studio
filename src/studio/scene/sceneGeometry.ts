import { absolutePosition } from "../canvas/canvasMath"
import { childrenOf, type StudioDocument } from "../model"

export type SceneTransform = {
  position: [number, number, number]
  scale: [number, number, number]
}

function verticalCenter(document: StudioDocument, nodeId: string) {
  const node = document.nodes[nodeId]
  if (!node.parentId) return node.height / 2
  const parent = document.nodes[node.parentId]
  if (node.type === "shelf" && parent.type === "rack") {
    const shelves = childrenOf(document, parent.id).filter((child) => child.type === "shelf")
    const index = shelves.findIndex((child) => child.id === node.id)
    return parent.height * ((index + 1) / (shelves.length + 1))
  }
  if (node.type === "bin" && parent.type === "shelf") {
    const rack = parent.parentId ? document.nodes[parent.parentId] : undefined
    if (rack?.type === "rack") {
      const shelves = childrenOf(document, rack.id).filter((child) => child.type === "shelf")
      const index = shelves.findIndex((child) => child.id === parent.id)
      return rack.height * ((index + 1) / (shelves.length + 1)) + node.height / 2
    }
  }
  return node.height / 2
}

export function nodeSceneTransform(document: StudioDocument, nodeId: string, scopeId: string): SceneTransform {
  const node = document.nodes[nodeId]
  const scope = document.nodes[scopeId]
  const absolute = absolutePosition(document, nodeId)
  const scopeAbsolute = absolutePosition(document, scopeId)
  const localX = absolute.x - scopeAbsolute.x
  const localY = absolute.y - scopeAbsolute.y
  return {
    position: [localX + node.width / 2 - scope.width / 2, verticalCenter(document, nodeId), localY + node.depth / 2 - scope.depth / 2],
    scale: [node.width, Math.max(.35, node.height), node.depth],
  }
}
