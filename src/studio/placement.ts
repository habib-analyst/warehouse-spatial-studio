import { type NodeType, type StudioDocument, type StudioNode } from "./model"
import { roundFeet } from "./geometry"

export type Placement = Pick<StudioNode, "x" | "y" | "width" | "depth">

type ChildIndex = Map<string, StudioNode[]>

function buildChildIndex(document: StudioDocument): ChildIndex {
  const index: ChildIndex = new Map()
  for (const node of Object.values(document.nodes)) {
    if (!node.parentId) continue
    const list = index.get(node.parentId)
    if (list) list.push(node)
    else index.set(node.parentId, [node])
  }
  return index
}

function kids(index: ChildIndex, parentId: string) {
  return index.get(parentId) ?? []
}

/** Default capacities — parents are sized for these; adding more auto-expands and reflows. */
export const LAYOUT_CAPACITY = {
  warehouseStructural: 4, // halls + rooms + open stores
  warehouseShutters: 3, // shutters + gates along edge
  aisle: 10, // racks per aisle (vertical or horizontal)
  rackShelves: 4,
  shelfBins: 10, // bins per shelf in a grid
} as const

export const LAYOUT_GAP = {
  warehouse: 12,
  warehouseMargin: 10,
  shutterGap: 8,
  aisle: 6,
  aisleMargin: 6,
  rack: 4,
  rackMargin: 2,
  shelf: 1,
  shelfMargin: 0.5,
  bin: 0.35,
  binMargin: 0.3,
} as const

export const UNIT = {
  bin: { width: 3.2, depth: 4, height: 1.2 },
  shelf: { width: 29, depth: 5, height: 1.2 },
  rack: { width: 29, depth: 32, height: 12 },
  aisle: { width: 34, depth: 360, height: 0.2 },
  hall: { width: 120, depth: 380, height: 24 },
  room: { width: 72, depth: 54, height: 12 },
  openStore: { width: 70, depth: 40, height: 5 },
  zone: { width: 18, depth: 14, height: 5 },
  shutter: { width: 18, depth: 4, height: 14 },
  gate: { width: 14, depth: 4, height: 12 },
} as const

function structuralTypes(type: NodeType) {
  return type === "hall" || type === "room" || type === "openStore"
}

function accessTypes(type: NodeType) {
  return type === "shutter" || type === "gate"
}

export function shelfSizeForBins(binCount: number) {
  const count = Math.max(LAYOUT_CAPACITY.shelfBins, binCount)
  const cols = Math.min(8, count)
  const rows = Math.ceil(count / cols)
  const width = LAYOUT_GAP.binMargin * 2 + cols * UNIT.bin.width + Math.max(0, cols - 1) * LAYOUT_GAP.bin
  const depth = LAYOUT_GAP.binMargin * 2 + rows * UNIT.bin.depth + Math.max(0, rows - 1) * LAYOUT_GAP.bin
  return { width: roundFeet(width), depth: roundFeet(depth), cols, rows }
}

export function rackSizeForShelves(shelfCount: number) {
  const count = Math.max(LAYOUT_CAPACITY.rackShelves, shelfCount)
  const shelf = shelfSizeForBins(LAYOUT_CAPACITY.shelfBins)
  const width = roundFeet(LAYOUT_GAP.shelfMargin * 2 + shelf.width)
  const depth = roundFeet(LAYOUT_GAP.shelfMargin * 2 + count * shelf.depth + Math.max(0, count - 1) * LAYOUT_GAP.shelf)
  return { width, depth, shelf }
}

export function aisleSizeForRacks(rackCount: number, horizontal = false) {
  const count = Math.max(LAYOUT_CAPACITY.aisle, rackCount)
  const rack = rackSizeForShelves(LAYOUT_CAPACITY.rackShelves)
  if (horizontal) {
    const width = roundFeet(LAYOUT_GAP.rackMargin * 2 + count * rack.width + Math.max(0, count - 1) * LAYOUT_GAP.rack)
    const depth = roundFeet(LAYOUT_GAP.rackMargin * 2 + rack.depth)
    return { width, depth, horizontal: true as const, rack }
  }
  const width = roundFeet(LAYOUT_GAP.rackMargin * 2 + rack.width)
  const depth = roundFeet(LAYOUT_GAP.rackMargin * 2 + count * rack.depth + Math.max(0, count - 1) * LAYOUT_GAP.rack)
  return { width, depth, horizontal: false as const, rack }
}

export function warehouseSizeForStructural(count: number) {
  const n = Math.max(LAYOUT_CAPACITY.warehouseStructural, count)
  const cols = Math.min(2, n)
  const rows = Math.ceil(n / cols)
  const cellW = UNIT.hall.width
  const cellD = UNIT.hall.depth
  const width = roundFeet(LAYOUT_GAP.warehouseMargin * 2 + cols * cellW + Math.max(0, cols - 1) * LAYOUT_GAP.warehouse)
  const depth = roundFeet(LAYOUT_GAP.warehouseMargin * 2 + rows * cellD + Math.max(0, rows - 1) * LAYOUT_GAP.warehouse + 18)
  return { width, depth, cols, rows, cellW, cellD }
}

function expandTo(node: StudioNode, width: number, depth: number) {
  node.width = roundFeet(Math.max(node.width, width))
  node.depth = roundFeet(Math.max(node.depth, depth))
}

/** Pack nodes left-to-right in rows of `cols`, using each node's actual size. Returns content bounds. */
function packGrid(nodes: StudioNode[], margin: number, gap: number, cols: number) {
  if (!nodes.length) return { width: margin * 2, depth: margin * 2 }
  const columnCount = Math.max(1, Math.min(cols, nodes.length))
  let cursorY = margin
  let maxRight = margin
  for (let row = 0; row * columnCount < nodes.length; row += 1) {
    const rowNodes = nodes.slice(row * columnCount, row * columnCount + columnCount)
    let cursorX = margin
    let rowDepth = 0
    for (const node of rowNodes) {
      node.x = roundFeet(cursorX)
      node.y = roundFeet(cursorY)
      cursorX = roundFeet(cursorX + node.width + gap)
      rowDepth = Math.max(rowDepth, node.depth)
    }
    maxRight = Math.max(maxRight, cursorX - gap)
    cursorY = roundFeet(cursorY + rowDepth + gap)
  }
  return {
    width: roundFeet(maxRight + margin),
    depth: roundFeet(cursorY - gap + margin),
  }
}

function layoutBins(index: ChildIndex, shelf: StudioNode) {
  const bins = kids(index, shelf.id).filter((node) => node.type === "bin").sort((a, b) => a.code.localeCompare(b.code))
  const size = shelfSizeForBins(bins.length || LAYOUT_CAPACITY.shelfBins)
  shelf.width = size.width
  shelf.depth = size.depth
  bins.forEach((bin, indexNo) => {
    const col = indexNo % size.cols
    const row = Math.floor(indexNo / size.cols)
    bin.width = UNIT.bin.width
    bin.depth = UNIT.bin.depth
    bin.height = UNIT.bin.height
    bin.x = roundFeet(LAYOUT_GAP.binMargin + col * (UNIT.bin.width + LAYOUT_GAP.bin))
    bin.y = roundFeet(LAYOUT_GAP.binMargin + row * (UNIT.bin.depth + LAYOUT_GAP.bin))
  })
}

function layoutShelves(index: ChildIndex, rack: StudioNode) {
  const shelves = kids(index, rack.id).filter((node) => node.type === "shelf").sort((a, b) => a.code.localeCompare(b.code))
  if (!shelves.length) {
    const size = rackSizeForShelves(LAYOUT_CAPACITY.rackShelves)
    expandTo(rack, size.width, size.depth)
    return
  }
  shelves.forEach((shelf) => layoutBins(index, shelf))
  const margin = LAYOUT_GAP.shelfMargin
  const gap = LAYOUT_GAP.shelf
  let y = margin
  let maxWidth = 0
  shelves.forEach((shelf) => {
    shelf.x = roundFeet(margin)
    shelf.y = roundFeet(y)
    maxWidth = Math.max(maxWidth, shelf.width)
    y = roundFeet(y + shelf.depth + gap)
  })
  rack.width = roundFeet(margin * 2 + maxWidth)
  rack.depth = roundFeet(y - gap + margin)
  shelves.forEach((shelf) => {
    shelf.width = Math.min(shelf.width, rack.width - margin * 2)
  })
}

function layoutRacks(index: ChildIndex, aisle: StudioNode) {
  const racks = kids(index, aisle.id).filter((node) => node.type === "rack").sort((a, b) => a.code.localeCompare(b.code))
  const horizontal = aisle.aisleOrientation === "horizontal"
  aisle.aisleOrientation = horizontal ? "horizontal" : "vertical"
  if (!racks.length) {
    const size = aisleSizeForRacks(LAYOUT_CAPACITY.aisle, horizontal)
    expandTo(aisle, size.width, size.depth)
    return
  }
  racks.forEach((rack) => layoutShelves(index, rack))
  const margin = LAYOUT_GAP.rackMargin
  const gap = LAYOUT_GAP.rack
  if (horizontal) {
    let x = margin
    let maxDepth = 0
    racks.forEach((rack) => {
      rack.x = roundFeet(x)
      rack.y = roundFeet(margin)
      maxDepth = Math.max(maxDepth, rack.depth)
      x = roundFeet(x + rack.width + gap)
    })
    aisle.width = roundFeet(x - gap + margin)
    aisle.depth = roundFeet(margin * 2 + maxDepth)
  } else {
    let y = margin
    let maxWidth = 0
    racks.forEach((rack) => {
      rack.x = roundFeet(margin)
      rack.y = roundFeet(y)
      maxWidth = Math.max(maxWidth, rack.width)
      y = roundFeet(y + rack.depth + gap)
    })
    aisle.width = roundFeet(margin * 2 + maxWidth)
    aisle.depth = roundFeet(y - gap + margin)
  }
}

function layoutAisles(index: ChildIndex, hall: StudioNode) {
  const aisles = kids(index, hall.id).filter((node) => node.type === "aisle").sort((a, b) => a.code.localeCompare(b.code))
  const racks = kids(index, hall.id).filter((node) => node.type === "rack").sort((a, b) => a.code.localeCompare(b.code))
  const zones = kids(index, hall.id).filter((node) => node.type === "zone" || node.type === "openStore").sort((a, b) => a.code.localeCompare(b.code))
  const access = kids(index, hall.id).filter((node) => accessTypes(node.type)).sort((a, b) => a.code.localeCompare(b.code))
  const vertical = aisles.filter((node) => (node.aisleOrientation ?? "vertical") === "vertical")
  const horizontal = aisles.filter((node) => node.aisleOrientation === "horizontal")
  const gap = LAYOUT_GAP.aisle
  const margin = LAYOUT_GAP.aisleMargin
  const zoneBand = zones.length || access.length ? 40 : 12

  aisles.forEach((aisle) => layoutRacks(index, aisle))
  racks.forEach((rack) => layoutShelves(index, rack))

  if (!aisles.length && !racks.length) {
    expandTo(hall, UNIT.hall.width, UNIT.hall.depth)
  }

  let cursorY = margin
  let maxRight = margin

  if (vertical.length) {
    let x = margin
    let rowDepth = 0
    vertical.forEach((aisle) => {
      aisle.x = roundFeet(x)
      aisle.y = roundFeet(cursorY)
      x = roundFeet(x + aisle.width + gap)
      rowDepth = Math.max(rowDepth, aisle.depth)
    })
    maxRight = Math.max(maxRight, x - gap)
    cursorY = roundFeet(cursorY + rowDepth + gap)
  }

  horizontal.forEach((aisle) => {
    aisle.x = roundFeet(margin)
    aisle.y = roundFeet(cursorY)
    maxRight = Math.max(maxRight, margin + aisle.width)
    cursorY = roundFeet(cursorY + aisle.depth + gap)
  })

  if (racks.length) {
    const pack = packGrid(racks, margin, gap, Math.min(3, racks.length))
    racks.forEach((rack) => {
      rack.y = roundFeet(rack.y + cursorY - margin)
    })
    maxRight = Math.max(maxRight, pack.width - margin)
    cursorY = roundFeet(cursorY + pack.depth - margin * 2 + gap)
  }

  const contentDepth = Math.max(cursorY - (aisles.length || racks.length ? gap : 0), margin)
  hall.width = roundFeet(Math.max(maxRight + margin, UNIT.hall.width * 0.5, margin * 2 + 40))
  hall.depth = roundFeet(contentDepth + zoneBand)

  zones.forEach((zone, indexNo) => {
    const cols = Math.min(Math.max(zones.length, 1), 4)
    const cellW = roundFeet((hall.width - margin * 2 - Math.max(0, cols - 1) * 4) / cols)
    zone.width = Math.min(zone.width || UNIT.zone.width, cellW)
    zone.depth = Math.min(zone.depth || UNIT.zone.depth, zoneBand - 8)
    zone.x = roundFeet(margin + (indexNo % cols) * (cellW + 4))
    zone.y = roundFeet(hall.depth - zoneBand + 4)
  })

  access.forEach((node, indexNo) => {
    node.width = UNIT.shutter.width
    node.depth = UNIT.shutter.depth
    const span = hall.width - margin * 2
    if (access.length === 1) node.x = roundFeet((hall.width - node.width) / 2)
    else node.x = roundFeet(margin + indexNo * ((span - node.width) / Math.max(1, access.length - 1)))
    node.y = roundFeet(hall.depth - node.depth)
  })
}

function layoutWarehouse(index: ChildIndex, warehouse: StudioNode) {
  const structural = kids(index, warehouse.id).filter((node) => structuralTypes(node.type)).sort((a, b) => a.code.localeCompare(b.code))
  const access = kids(index, warehouse.id).filter((node) => accessTypes(node.type)).sort((a, b) => a.code.localeCompare(b.code))
  const margin = LAYOUT_GAP.warehouseMargin
  const gap = LAYOUT_GAP.warehouse
  const accessBand = 18

  structural.forEach((node) => {
    if (node.type === "hall" || node.type === "room") {
      layoutAisles(index, node)
    } else {
      node.width = UNIT.openStore.width
      node.depth = UNIT.openStore.depth
    }
  })

  if (!structural.length) {
    const size = warehouseSizeForStructural(LAYOUT_CAPACITY.warehouseStructural)
    expandTo(warehouse, size.width, size.depth)
  } else {
    const cols = Math.min(2, structural.length)
    const bounds = packGrid(structural, margin, gap, cols)
    warehouse.width = roundFeet(Math.max(bounds.width, warehouseSizeForStructural(structural.length).width * 0.35))
    warehouse.depth = roundFeet(bounds.depth + accessBand)
  }

  const shutterCount = Math.max(access.length, LAYOUT_CAPACITY.warehouseShutters)
  access.forEach((node, indexNo) => {
    node.width = node.type === "gate" ? UNIT.gate.width : UNIT.shutter.width
    node.depth = UNIT.shutter.depth
    const usable = warehouse.width - margin * 2 - node.width
    node.x = roundFeet(margin + (shutterCount <= 1 ? usable / 2 : indexNo * (usable / Math.max(1, shutterCount - 1))))
    node.y = roundFeet(warehouse.depth - node.depth - 2)
  })
}

/** Reflow children and grow parents so multi-add always fits with default gaps. */
export function autoLayoutTree(document: StudioDocument, fromId: string) {
  const index = buildChildIndex(document)
  let node: StudioNode | undefined = document.nodes[fromId]
  while (node) {
    if (node.type === "shelf") layoutBins(index, node)
    if (node.type === "rack") layoutShelves(index, node)
    if (node.type === "aisle") layoutRacks(index, node)
    if (node.type === "hall" || node.type === "room") layoutAisles(index, node)
    if (node.type === "warehouse") layoutWarehouse(index, node)
    node = node.parentId ? document.nodes[node.parentId] : undefined
  }
}

export function defaultChildSize(type: NodeType, aisleOrientation: "vertical" | "horizontal" = "vertical"): Pick<StudioNode, "width" | "depth" | "height"> {
  if (type === "bin") return { ...UNIT.bin }
  if (type === "shelf") {
    const size = shelfSizeForBins(LAYOUT_CAPACITY.shelfBins)
    return { width: size.width, depth: size.depth, height: UNIT.shelf.height }
  }
  if (type === "rack") {
    const size = rackSizeForShelves(LAYOUT_CAPACITY.rackShelves)
    return { width: size.width, depth: size.depth, height: UNIT.rack.height }
  }
  if (type === "aisle") {
    const size = aisleSizeForRacks(LAYOUT_CAPACITY.aisle, aisleOrientation === "horizontal")
    return { width: size.width, depth: size.depth, height: UNIT.aisle.height }
  }
  if (type === "hall") return { ...UNIT.hall }
  if (type === "room") return { ...UNIT.room }
  if (type === "openStore") return { ...UNIT.openStore }
  if (type === "zone") return { ...UNIT.zone }
  if (type === "gate") return { ...UNIT.gate }
  if (type === "shutter") return { ...UNIT.shutter }
  return { width: 20, depth: 20, height: 10 }
}

/** @deprecated Prefer autoLayoutTree after insert. Kept for tests that expect a first slot. */
export function nextPlacement(document: StudioDocument, parentId: string, type: NodeType, requested: Pick<StudioNode, "width" | "depth">): Placement | null {
  const parent = document.nodes[parentId]
  if (!parent) return null
  const size = defaultChildSize(type)
  const width = Math.min(requested.width || size.width, size.width)
  const depth = Math.min(requested.depth || size.depth, size.depth)
  return { x: LAYOUT_GAP.warehouseMargin, y: LAYOUT_GAP.warehouseMargin, width, depth }
}
