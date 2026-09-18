import { canParent, buildChildrenIndex, indexedChildren, type StudioDocument, type StudioNode } from "./model"

export type ValidationIssue = {
  id: string
  nodeId: string
  severity: "error" | "recommendation"
  code: "invalid-parent" | "outside-parent" | "duplicate-code" | "overlap" | "empty-container"
  message: string
}

type Rect = Pick<StudioNode, "x" | "y" | "width" | "depth">

/** Default grid: 1 ft so canvas feet match property-panel feet. */
export function snapValue(value: number, grid = 1) {
  return Math.round(value / grid) * grid
}

export function roundFeet(value: number, precision = 2) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function clampToParent(child: Rect, parent: Pick<StudioNode, "width" | "depth">) {
  return {
    x: Math.min(Math.max(0, child.x), Math.max(0, parent.width - child.width)),
    y: Math.min(Math.max(0, child.y), Math.max(0, parent.depth - child.depth)),
  }
}

/** Shrink and clamp so the child always fits fully inside the parent. */
export function fitRectInParent(child: Rect, parent: Pick<StudioNode, "width" | "depth">): Rect {
  const width = roundFeet(Math.min(Math.max(0.1, child.width), Math.max(0.1, parent.width)))
  const depth = roundFeet(Math.min(Math.max(0.1, child.depth), Math.max(0.1, parent.depth)))
  return {
    width,
    depth,
    x: roundFeet(Math.min(Math.max(0, child.x), Math.max(0, parent.width - width))),
    y: roundFeet(Math.min(Math.max(0, child.y), Math.max(0, parent.depth - depth))),
  }
}

/** Grid snap + pull to sibling edges / parent edges within threshold (ft). */
export function smartSnapRect(
  rect: Rect,
  parent: Pick<StudioNode, "width" | "depth">,
  siblings: Rect[],
  options: { grid?: number; threshold?: number; free?: boolean } = {},
): Rect {
  const grid = options.grid ?? 1
  const threshold = options.threshold ?? 1.5
  if (options.free) {
    return { ...rect, x: roundFeet(rect.x), y: roundFeet(rect.y), width: roundFeet(Math.max(0.1, rect.width)), depth: roundFeet(Math.max(0.1, rect.depth)) }
  }

  const anchorsX = [0, parent.width, ...siblings.flatMap((item) => [item.x, item.x + item.width])]
  const anchorsY = [0, parent.depth, ...siblings.flatMap((item) => [item.y, item.y + item.depth])]

  const snapEdge = (value: number, size: number, anchors: number[]) => {
    let next = snapValue(value, grid)
    let best = Math.abs(next - value)
    for (const anchor of anchors) {
      for (const candidate of [anchor, anchor - size]) {
        const distance = Math.abs(candidate - value)
        if (distance <= threshold && distance < best) {
          best = distance
          next = candidate
        }
      }
    }
    return next
  }

  const width = Math.max(0.1, snapValue(rect.width, grid))
  const depth = Math.max(0.1, snapValue(rect.depth, grid))
  return {
    x: snapEdge(rect.x, width, anchorsX),
    y: snapEdge(rect.y, depth, anchorsY),
    width,
    depth,
  }
}

export function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.depth && a.y + a.depth > b.y
}

export function validateDocument(document: StudioDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const codeOwners = new Map<string, string>()
  const index = buildChildrenIndex(document)
  const nodes = Object.values(document.nodes)

  for (const node of nodes) {
    const owner = codeOwners.get(node.code)
    if (owner) {
      issues.push({ id: `duplicate-${node.id}`, nodeId: node.id, severity: "error", code: "duplicate-code", message: `${node.code} is used more than once.` })
    } else {
      codeOwners.set(node.code, node.id)
    }

    if (!node.parentId) continue
    const parent = document.nodes[node.parentId]
    if (!parent || !canParent(parent.type, node.type)) {
      issues.push({ id: `parent-${node.id}`, nodeId: node.id, severity: "error", code: "invalid-parent", message: `${node.code} has an invalid parent.` })
      continue
    }
    if (node.x < 0 || node.y < 0 || node.x + node.width > parent.width || node.y + node.depth > parent.depth) {
      issues.push({ id: `bounds-${node.id}`, nodeId: node.id, severity: "error", code: "outside-parent", message: `${node.code} extends beyond ${parent.code}.` })
    }
  }

  const overlapTypes = new Set(["hall", "room", "aisle", "rack", "shelf", "bin", "openStore", "zone"])
  for (const parent of nodes) {
    const children = indexedChildren(index, parent.id).filter((node) => overlapTypes.has(node.type))
    for (let i = 0; i < children.length; i += 1) {
      for (let j = i + 1; j < children.length; j += 1) {
        const a = children[i]
        const b = children[j]
        if (rectsOverlap(a, b)) {
          issues.push({ id: `overlap-${a.id}-${b.id}`, nodeId: a.id, severity: "error", code: "overlap", message: `${a.code} overlaps ${b.code}.` })
        }
      }
    }
  }

  for (const node of nodes) {
    if (["hall", "room", "aisle", "rack", "shelf"].includes(node.type) && indexedChildren(index, node.id).length === 0) {
      issues.push({ id: `empty-${node.id}`, nodeId: node.id, severity: "recommendation", code: "empty-container", message: `${node.code} has no child components yet.` })
    }
  }
  return issues
}
