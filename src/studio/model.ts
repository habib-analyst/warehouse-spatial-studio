export type NodeType =
  | "warehouse"
  | "hall"
  | "room"
  | "aisle"
  | "openStore"
  | "zone"
  | "gate"
  | "shutter"
  | "rack"
  | "shelf"
  | "bin"

export type StudioMode = "building" | "storage" | "layout"
export type ViewMode = "2d" | "3d"
export type ToolMode = "select" | "pan"

export type StudioNode = {
  id: string
  type: NodeType
  parentId: string | null
  name: string
  code: string
  x: number
  y: number
  width: number
  depth: number
  height: number
  rotation: number
  locked: boolean
  color?: string
  capacity?: number
  shelves?: number
  binsPerShelf?: number
  faces?: 1 | 2
  aisleOrientation?: "vertical" | "horizontal"
  zoneKind?: string
  purpose?: string
  team?: string
}

export type StudioDocument = {
  version: 1
  rootId: string
  nodes: Record<string, StudioNode>
}

export const ALLOWED_CHILDREN: Record<NodeType, NodeType[]> = {
  warehouse: ["hall", "room", "openStore", "gate", "shutter"],
  hall: ["aisle", "rack", "openStore", "zone", "gate", "shutter"],
  room: ["aisle", "rack", "openStore", "zone", "gate", "shutter"],
  aisle: ["rack"],
  openStore: [],
  zone: [],
  gate: [],
  shutter: [],
  rack: ["shelf"],
  shelf: ["bin"],
  bin: [],
}

export const NODE_LABELS: Record<NodeType, string> = {
  warehouse: "Warehouse",
  hall: "Hall",
  room: "Room",
  aisle: "Aisle",
  openStore: "Open Store",
  zone: "Operational Zone",
  gate: "Gate",
  shutter: "Shutter",
  rack: "Rack",
  shelf: "Shelf",
  bin: "Bin",
}

const CODE_PREFIX: Record<NodeType, string> = {
  warehouse: "WH",
  hall: "HL",
  room: "RM",
  aisle: "AV",
  openStore: "OS",
  zone: "ZN",
  gate: "GT",
  shutter: "SH",
  rack: "RA",
  shelf: "SF",
  bin: "BN",
}

const DEFAULT_SIZE: Record<NodeType, Pick<StudioNode, "width" | "depth" | "height">> = {
  warehouse: { width: 280, depth: 420, height: 26 },
  hall: { width: 120, depth: 380, height: 24 },
  room: { width: 72, depth: 54, height: 12 },
  aisle: { width: 34, depth: 360, height: 0.2 },
  openStore: { width: 70, depth: 40, height: 5 },
  zone: { width: 18, depth: 14, height: 5 },
  gate: { width: 14, depth: 4, height: 12 },
  shutter: { width: 18, depth: 4, height: 14 },
  rack: { width: 29, depth: 32, height: 12 },
  shelf: { width: 29, depth: 5, height: 1.2 },
  bin: { width: 3.2, depth: 4, height: 1.2 },
}

export function canParent(parent: NodeType, child: NodeType) {
  return ALLOWED_CHILDREN[parent].includes(child)
}

export function childrenOf(document: StudioDocument, parentId: string) {
  return Object.values(document.nodes).filter((node) => node.parentId === parentId)
}

/** One-pass parent → children map for O(1) lookups on large warehouses. */
export function buildChildrenIndex(document: StudioDocument) {
  const index = new Map<string, StudioNode[]>()
  for (const node of Object.values(document.nodes)) {
    if (!node.parentId) continue
    const list = index.get(node.parentId)
    if (list) list.push(node)
    else index.set(node.parentId, [node])
  }
  return index
}

export function indexedChildren(index: Map<string, StudioNode[]>, parentId: string) {
  return index.get(parentId) ?? []
}

export function ancestorsOf(document: StudioDocument, nodeId: string) {
  const path: StudioNode[] = []
  let current: StudioNode | undefined = document.nodes[nodeId]
  while (current) {
    path.unshift(current)
    current = current.parentId ? document.nodes[current.parentId] : undefined
  }
  return path
}

/** Warehouse → … → selected codes (component path). */
export function componentPathCodes(document: StudioDocument, nodeId: string) {
  return ancestorsOf(document, nodeId).map((node) => node.code)
}

/** Full component id, e.g. WH04-HL01-AH04-RA131-SF01-BN01 */
export function fullComponentId(document: StudioDocument, nodeId: string) {
  return componentPathCodes(document, nodeId).join("-")
}

export function descendantsOf(document: StudioDocument, nodeId: string): StudioNode[] {
  const index = buildChildrenIndex(document)
  const out: StudioNode[] = []
  const stack = [...indexedChildren(index, nodeId)]
  while (stack.length) {
    const node = stack.pop()!
    out.push(node)
    const kids = index.get(node.id)
    if (kids) for (let i = kids.length - 1; i >= 0; i -= 1) stack.push(kids[i])
  }
  return out
}

export function nextCode(type: NodeType, document: StudioDocument) {
  const prefix = CODE_PREFIX[type]
  const used = new Set(
    Object.values(document.nodes)
      .filter((node) => node.type === type)
      .map((node) => Number(node.code.replace(/\D/g, "")))
      .filter(Number.isFinite),
  )
  let number = 1
  while (used.has(number)) number += 1
  return `${prefix}${String(number).padStart(2, "0")}`
}

function nodeId(type: NodeType) {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `${type}-${random}`
}

export function createEmptyDocument(): StudioDocument {
  const warehouse: StudioNode = {
    id: "warehouse-root",
    type: "warehouse",
    parentId: null,
    name: "",
    code: "",
    x: 0,
    y: 0,
    width: 0,
    depth: 0,
    height: 0,
    rotation: 0,
    locked: true,
  }
  return { version: 1, rootId: warehouse.id, nodes: { [warehouse.id]: warehouse } }
}

export function createNode(type: NodeType, parentId: string, document: StudioDocument): StudioNode {
  const parent = document.nodes[parentId]
  if (!parent) throw new Error("Parent does not exist")
  if (!canParent(parent.type, type)) throw new Error(`${NODE_LABELS[type]} cannot be placed inside ${NODE_LABELS[parent.type]}`)

  const size = DEFAULT_SIZE[type]
  const code = nextCode(type, document)
  return {
    id: nodeId(type),
    type,
    parentId,
    name: `${NODE_LABELS[type]} ${code}`,
    code,
    x: Math.max(0, (parent.width - size.width) / 2),
    y: Math.max(0, (parent.depth - size.depth) / 2),
    ...size,
    rotation: 0,
    locked: false,
    color: type === "openStore" ? "#dcecff" : undefined,
    capacity: type === "openStore" ? 24 : undefined,
    shelves: type === "rack" ? 4 : undefined,
    binsPerShelf: type === "rack" ? 10 : undefined,
    faces: type === "rack" ? 2 : undefined,
  }
}
