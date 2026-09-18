import { createEmptyDocument, type NodeType, type StudioDocument, type StudioNode } from "./model"
import { autoLayoutTree, UNIT } from "./placement"

/** Full starter layout on open. Reset clears to empty so user can build from scratch. */
export const DEFAULT_LAYOUT = {
  halls: 3,
  rooms: 2,
  openStores: 1,
  gates: 3,
  verticalAisles: 10,
  horizontalAisles: 10,
  racks: 10,
  shelves: 4,
  bins: 10,
} as const

function pad(value: number, width = 2) {
  return String(value).padStart(width, "0")
}

/** Build the default filled warehouse in one pass, then auto-layout once. */
export function createDefaultDocument(): StudioDocument {
  const document = createEmptyDocument()
  const counters: Record<string, number> = {}
  let seq = 0

  const next = (key: string, width = 2) => {
    counters[key] = (counters[key] ?? 0) + 1
    return pad(counters[key], width)
  }

  const insert = (type: NodeType, parentId: string, patch: Partial<StudioNode> = {}) => {
    seq += 1
    const size = UNIT[type as keyof typeof UNIT] ?? { width: 20, depth: 20, height: 10 }
    const code = patch.code ?? `${type === "aisle" && patch.aisleOrientation === "horizontal" ? "AH" : ({
      hall: "HL", room: "RM", aisle: "AV", openStore: "OS", zone: "ZN", gate: "GT", shutter: "SH", rack: "RA", shelf: "SF", bin: "BN", warehouse: "WH",
    } as Record<NodeType, string>)[type]}${next(type === "aisle" && patch.aisleOrientation === "horizontal" ? "AH" : type, type === "bin" ? 4 : 2)}`
    const node: StudioNode = {
      id: `default-${type}-${seq}`,
      type,
      parentId,
      name: patch.name ?? code,
      code,
      x: patch.x ?? 0,
      y: patch.y ?? 0,
      width: patch.width ?? size.width,
      depth: patch.depth ?? size.depth,
      height: patch.height ?? size.height,
      rotation: patch.rotation ?? 0,
      locked: patch.locked ?? false,
      color: patch.color,
      capacity: patch.capacity,
      shelves: patch.shelves,
      binsPerShelf: patch.binsPerShelf,
      faces: patch.faces,
      aisleOrientation: patch.aisleOrientation,
      zoneKind: patch.zoneKind,
      purpose: patch.purpose,
      team: patch.team,
    }
    document.nodes[node.id] = node
    return node
  }

  const fillAisle = (aisleId: string) => {
    for (let rackIndex = 0; rackIndex < DEFAULT_LAYOUT.racks; rackIndex += 1) {
      const rack = insert("rack", aisleId, {
        name: `Rack ${pad(rackIndex + 1)}`,
        shelves: DEFAULT_LAYOUT.shelves,
        binsPerShelf: DEFAULT_LAYOUT.bins,
        faces: 2,
      })
      for (let shelfIndex = 0; shelfIndex < DEFAULT_LAYOUT.shelves; shelfIndex += 1) {
        const shelf = insert("shelf", rack.id, { name: `Shelf ${pad(shelfIndex + 1)}` })
        for (let binIndex = 0; binIndex < DEFAULT_LAYOUT.bins; binIndex += 1) {
          insert("bin", shelf.id, { name: `Bin ${pad(binIndex + 1)}` })
        }
      }
    }
  }

  for (let index = 0; index < DEFAULT_LAYOUT.halls; index += 1) {
    const hall = insert("hall", document.rootId, {
      name: `Storage Hall ${pad(index + 1)}`,
      width: UNIT.hall.width,
      depth: UNIT.hall.depth,
      height: UNIT.hall.height,
    })
    for (let aisleIndex = 0; aisleIndex < DEFAULT_LAYOUT.verticalAisles; aisleIndex += 1) {
      const aisle = insert("aisle", hall.id, {
        aisleOrientation: "vertical",
        name: `Vertical Aisle ${pad(aisleIndex + 1)}`,
      })
      fillAisle(aisle.id)
    }
    for (let aisleIndex = 0; aisleIndex < DEFAULT_LAYOUT.horizontalAisles; aisleIndex += 1) {
      const aisle = insert("aisle", hall.id, {
        aisleOrientation: "horizontal",
        name: `Horizontal Aisle ${pad(aisleIndex + 1)}`,
      })
      fillAisle(aisle.id)
    }
  }

  for (let index = 0; index < DEFAULT_LAYOUT.rooms; index += 1) {
    insert("room", document.rootId, {
      name: `Operations Room ${pad(index + 1)}`,
      width: UNIT.room.width,
      depth: UNIT.room.depth,
      height: UNIT.room.height,
    })
  }

  for (let index = 0; index < DEFAULT_LAYOUT.openStores; index += 1) {
    insert("openStore", document.rootId, {
      name: `Open Store ${pad(index + 1)}`,
      width: UNIT.openStore.width,
      depth: UNIT.openStore.depth,
      height: UNIT.openStore.height,
      color: "#dcecff",
      capacity: 24,
    })
  }

  for (let index = 0; index < DEFAULT_LAYOUT.gates; index += 1) {
    insert("gate", document.rootId, {
      name: ["Receiving Gate", "Main Gate", "Dispatch Gate"][index] ?? `Gate ${pad(index + 1)}`,
      width: UNIT.gate.width,
      depth: UNIT.gate.depth,
      height: UNIT.gate.height,
    })
  }

  autoLayoutTree(document, document.rootId)
  return document
}

let cachedDefault: StudioDocument | null = null

/** Cached starter document for open / Reset (cloned per use). */
export function getDefaultDocument() {
  if (!cachedDefault) cachedDefault = createDefaultDocument()
  return structuredClone(cachedDefault)
}

/** Drop cached starter after layout constant changes (HMR / tests). */
export function clearDefaultDocumentCache() {
  cachedDefault = null
}

// Invalidate stale cache when this module reloads with new DEFAULT_LAYOUT.
clearDefaultDocumentCache()

