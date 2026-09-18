import type { StudioDocument, StudioNode } from "../model"

type Point = { x: number; y: number }
type View = { scale: number; offsetX: number; offsetY: number }

export function fitView(container: { width: number; height: number }, world: { width: number; depth: number }, padding = 48): View {
  const scale = Math.min((container.width - padding * 2) / world.width, (container.height - padding * 2) / world.depth)
  return {
    scale,
    offsetX: (container.width - world.width * scale) / 2,
    offsetY: (container.height - world.depth * scale) / 2,
  }
}

export function zoomAtPointer(view: View, pointer: Point, scale: number): View {
  const worldX = (pointer.x - view.offsetX) / view.scale
  const worldY = (pointer.y - view.offsetY) / view.scale
  return {
    scale,
    offsetX: pointer.x - worldX * scale,
    offsetY: pointer.y - worldY * scale,
  }
}

export function absolutePosition(document: StudioDocument, nodeId: string): Point {
  let node: StudioNode | undefined = document.nodes[nodeId]
  let x = 0
  let y = 0
  while (node) {
    x += node.x
    y += node.y
    node = node.parentId ? document.nodes[node.parentId] : undefined
  }
  return { x, y }
}

export function pointToParentLocal(document: StudioDocument, parentId: string, point: Point): Point {
  const parent = absolutePosition(document, parentId)
  return { x: point.x - parent.x, y: point.y - parent.y }
}
