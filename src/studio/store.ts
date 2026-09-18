import { create } from "zustand"
import { getDefaultDocument } from "./defaultDocument"
import { fitRectInParent, rectsOverlap, roundFeet, smartSnapRect } from "./geometry"
import { canParent, childrenOf, createEmptyDocument, createNode, descendantsOf, nextCode, type NodeType, type StudioDocument, type StudioMode, type StudioNode, type ToolMode, type ViewMode } from "./model"
import { createSampleDocument } from "./sample"
import type { MeasurementMode, MeasurementUnit } from "./measurements"
import { autoLayoutTree, defaultChildSize, UNIT } from "./placement"
import { defaultProfile, type WarehouseProfile } from "./profile"

type Notice = { tone: "error" | "success" | "info"; message: string }
type Toggles = { snap: boolean; grid: boolean; labels: boolean; dimensions: boolean; faces: boolean; routes: boolean }
type StorageLayoutOptions = { aisles: number; racks: number; shelves: number; bins: number; rackWidth?: number; rackDepth?: number; rackHeight?: number; faces?: 1 | 2 }
export type WizardStep = 1 | 2 | 3 | 4 | 5

type StudioState = {
  document: StudioDocument
  selectedId: string
  scopeId: string
  wizardStep: WizardStep
  studioMode: StudioMode
  viewMode: ViewMode
  tool: ToolMode
  leftTab: "library" | "hierarchy"
  rightTab: "properties" | "tree"
  measurementMode: MeasurementMode
  globalUnit: MeasurementUnit
  fieldUnits: Record<string, MeasurementUnit>
  zoom2D: number
  freePlace: boolean
  showCanvasTree: boolean
  fitRequest: number
  profile: WarehouseProfile
  toggles: Toggles
  past: StudioDocument[]
  future: StudioDocument[]
  notice: Notice | null
  setWizardStep: (step: WizardStep) => void
  setStudioMode: (mode: StudioMode) => void
  setViewMode: (mode: ViewMode) => void
  setTool: (tool: ToolMode) => void
  setLeftTab: (tab: "library" | "hierarchy") => void
  setRightTab: (tab: "properties" | "tree") => void
  setMeasurementMode: (mode: MeasurementMode) => void
  setGlobalUnit: (unit: MeasurementUnit) => void
  setFieldUnit: (field: string, unit: MeasurementUnit) => void
  setZoom2D: (zoom: number) => void
  setFreePlace: (free: boolean) => void
  setShowCanvasTree: (show: boolean) => void
  requestFit: () => void
  updateProfile: (patch: Partial<WarehouseProfile>) => void
  toggle: (key: keyof Toggles) => void
  selectNode: (id: string) => void
  setScope: (id: string) => void
  addNode: (type: NodeType, parentId?: string, point?: { x: number; y: number }, options?: { aisleOrientation?: "vertical" | "horizontal" }) => string | null
  updateNode: (id: string, patch: Partial<StudioNode>) => void
  moveNode: (id: string, point: { x: number; y: number }) => void
  resizeNode: (id: string, size: { x: number; y: number; width: number; depth: number }) => void
  duplicateNode: (id: string) => string | null
  deleteNode: (id: string) => void
  generateHalls: (count: number, gap: number) => void
  generateStorageLayout: (hallId: string, options: StorageLayoutOptions) => void
  undo: () => void
  redo: () => void
  loadSample: () => void
  clearDocument: () => void
  resetWarehouse: () => void
  seedDefaultIfNeeded: () => void
}

function clone(document: StudioDocument) {
  return structuredClone(document)
}

function withSnapshot(state: StudioState, document: StudioDocument, selectedId = state.selectedId) {
  return {
    document,
    selectedId,
    past: [...state.past.slice(-39), clone(state.document)],
    future: [],
  }
}

function addGenerated(document: StudioDocument, type: NodeType, parentId: string, patch: Partial<StudioNode> & { id: string; code: string; name: string }) {
  const node = { ...createNode(type, parentId, document), ...patch, type, parentId }
  document.nodes[node.id] = node
  return node
}

function siblingRects(document: StudioDocument, nodeId: string, parentId: string) {
  return childrenOf(document, parentId)
    .filter((node) => node.id !== nodeId)
    .map((node) => ({ x: node.x, y: node.y, width: node.width, depth: node.depth }))
}

export const useStudioStore = create<StudioState>((set, get) => ({
  document: createEmptyDocument(),
  selectedId: "warehouse-root",
  scopeId: "warehouse-root",
  wizardStep: 1,
  studioMode: "building",
  viewMode: "2d",
  tool: "select",
  leftTab: "library",
  rightTab: "properties",
  measurementMode: "global",
  globalUnit: "ft",
  fieldUnits: {},
  zoom2D: 1,
  freePlace: false,
  showCanvasTree: true,
  fitRequest: 0,
  profile: defaultProfile(),
  toggles: { snap: true, grid: true, labels: true, dimensions: true, faces: true, routes: true },
  past: [],
  future: [],
  notice: null,
  setWizardStep: (wizardStep) => set({
    wizardStep,
    studioMode: wizardStep === 3 ? "storage" : wizardStep === 4 ? "layout" : wizardStep === 2 ? "building" : get().studioMode,
  }),
  setStudioMode: (studioMode) => set({
    studioMode,
    wizardStep: studioMode === "building" ? 2 : studioMode === "storage" ? 3 : 4,
  }),
  setViewMode: (viewMode) => set({ viewMode }),
  setTool: (tool) => set({ tool }),
  setLeftTab: (leftTab) => set({ leftTab }),
  setRightTab: (rightTab) => set({ rightTab }),
  setMeasurementMode: (measurementMode) => set({ measurementMode }),
  setGlobalUnit: (globalUnit) => set({ globalUnit }),
  setFieldUnit: (field, unit) => set((state) => ({ fieldUnits: { ...state.fieldUnits, [field]: unit } })),
  setZoom2D: (zoom2D) => set({ zoom2D: Math.min(80, Math.max(0.08, zoom2D)) }),
  setFreePlace: (freePlace) => set({ freePlace }),
  setShowCanvasTree: (showCanvasTree) => set({ showCanvasTree }),
  requestFit: () => set((state) => ({ fitRequest: state.fitRequest + 1 })),
  updateProfile: (patch) => set((state) => {
    const profile = { ...state.profile, ...patch }
    const document = clone(state.document)
    const root = document.nodes[document.rootId]
    if (patch.code != null || patch.name != null) {
      document.nodes[document.rootId] = {
        ...root,
        code: profile.code || root.code,
        name: profile.name || root.name,
      }
      return { profile, document }
    }
    return { profile }
  }),
  toggle: (key) => set((state) => ({ toggles: { ...state.toggles, [key]: !state.toggles[key] } })),
  selectNode: (selectedId) => set({ selectedId, rightTab: "properties" }),
  setScope: (scopeId) => set({ scopeId, selectedId: scopeId }),
  addNode: (type, explicitParentId, point, options) => {
    const state = get()
    const candidateIds = [explicitParentId, state.selectedId, state.scopeId].filter(Boolean) as string[]
    const parentId = candidateIds.find((id) => {
      const parent = state.document.nodes[id]
      return parent && canParent(parent.type, type)
    })
    if (!parentId) {
      set({ notice: { tone: "error", message: `Select a valid parent before adding this component.` } })
      return null
    }
    const orientation = options?.aisleOrientation ?? "vertical"
    const document = clone(state.document)
    const node = createNode(type, parentId, document)
    const size = defaultChildSize(type, orientation)
    Object.assign(node, size)
    if (type === "aisle") {
      node.aisleOrientation = orientation
      node.name = orientation === "horizontal" ? `Horizontal Aisle ${node.code}` : `Vertical Aisle ${node.code}`
    }
    if (point) {
      const parent = document.nodes[parentId]
      const raw = { ...node, x: point.x - node.width / 2, y: point.y - node.depth / 2 }
      const snapped = state.toggles.snap
        ? smartSnapRect(raw, parent, siblingRects(document, node.id, parentId), { free: state.freePlace })
        : { ...raw, x: roundFeet(raw.x), y: roundFeet(raw.y) }
      const next = fitRectInParent(snapped, parent)
      node.x = next.x
      node.y = next.y
      node.width = next.width
      node.depth = next.depth
    }
    document.nodes[node.id] = node
    autoLayoutTree(document, parentId)
    // Stay on parent so Add Hall / Add Bin / etc. remain available for the next sibling.
    set({
      ...withSnapshot(state, document, parentId),
      fitRequest: state.fitRequest + 1,
      notice: { tone: "success", message: `${node.code} added under ${document.nodes[parentId].code}. Click Add again for another.` },
    })
    return node.id
  },
  updateNode: (id, patch) => set((state) => {
    if (!state.document.nodes[id]) return state
    const document = clone(state.document)
    const current = document.nodes[id]
    let next = { ...current, ...patch }
    next.x = roundFeet(Number(next.x))
    next.y = roundFeet(Number(next.y))
    next.width = roundFeet(Math.max(0.1, Number(next.width)))
    next.depth = roundFeet(Math.max(0.1, Number(next.depth)))
    next.height = roundFeet(Math.max(0.1, Number(next.height)))
    if (current.parentId) {
      const parent = document.nodes[current.parentId]
      if (state.toggles.snap && !state.freePlace) {
        next = { ...next, ...smartSnapRect(next, parent, siblingRects(document, id, current.parentId)) }
      }
      next = { ...next, ...fitRectInParent(next, parent) }
    }
    document.nodes[id] = next
    if (next.type === "aisle" && patch.aisleOrientation) {
      next.name = patch.aisleOrientation === "horizontal" ? `Horizontal Aisle ${next.code}` : `Vertical Aisle ${next.code}`
      document.nodes[id] = next
      if (next.parentId) autoLayoutTree(document, next.parentId)
    }
    const containChildren = (parentId: string) => {
      const parent = document.nodes[parentId]
      childrenOf(document, parentId).forEach((child) => {
        const fitted = fitRectInParent(child, parent)
        document.nodes[child.id] = { ...child, ...fitted }
        containChildren(child.id)
      })
    }
    containChildren(id)
    if (current.parentId) {
      const siblings = siblingRects(document, id, current.parentId)
      const self = document.nodes[id]
      if (siblings.some((sibling) => rectsOverlap(self, sibling))) {
        autoLayoutTree(document, current.parentId)
      }
    }
    return { ...withSnapshot(state, document, id), notice: null }
  }),
  moveNode: (id, point) => set((state) => {
    const node = state.document.nodes[id]
    const parent = node?.parentId ? state.document.nodes[node.parentId] : undefined
    if (!node || !parent || node.locked) return state
    const raw = { x: point.x, y: point.y, width: node.width, depth: node.depth }
    const snapped = state.toggles.snap
      ? smartSnapRect(raw, parent, siblingRects(state.document, id, parent.id), { free: state.freePlace })
      : { ...raw, x: roundFeet(raw.x), y: roundFeet(raw.y) }
    const fitted = fitRectInParent(snapped, parent)
    const document = clone(state.document)
    document.nodes[id] = { ...node, x: fitted.x, y: fitted.y, width: fitted.width, depth: fitted.depth }
    const siblings = siblingRects(document, id, parent.id)
    if (siblings.some((sibling) => rectsOverlap(document.nodes[id], sibling))) {
      autoLayoutTree(document, parent.id)
    }
    return { ...withSnapshot(state, document, id), notice: null }
  }),
  resizeNode: (id, box) => set((state) => {
    const node = state.document.nodes[id]
    const parent = node?.parentId ? state.document.nodes[node.parentId] : undefined
    if (!node || !parent || node.locked) return state
    const raw = { x: box.x, y: box.y, width: Math.max(1, box.width), depth: Math.max(1, box.depth) }
    const snapped = state.toggles.snap
      ? smartSnapRect(raw, parent, siblingRects(state.document, id, parent.id), { free: state.freePlace })
      : { ...raw, x: roundFeet(raw.x), y: roundFeet(raw.y), width: roundFeet(raw.width), depth: roundFeet(raw.depth) }
    const fitted = fitRectInParent(snapped, parent)
    const document = clone(state.document)
    document.nodes[id] = { ...node, ...fitted }
    const siblings = siblingRects(document, id, parent.id)
    if (siblings.some((sibling) => rectsOverlap(document.nodes[id], sibling))) {
      autoLayoutTree(document, parent.id)
    }
    return { ...withSnapshot(state, document, id), notice: null }
  }),
  duplicateNode: (id) => {
    const state = get()
    const source = state.document.nodes[id]
    if (!source?.parentId) return null
    const document = clone(state.document)
    const parent = document.nodes[source.parentId]
    const duplicate: StudioNode = {
      ...source,
      id: `${source.type}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      code: nextCode(source.type, document),
      name: `${source.name} copy`,
      x: Math.min(parent.width - source.width, source.x + 8),
      y: Math.min(parent.depth - source.depth, source.y + 8),
    }
    document.nodes[duplicate.id] = duplicate
    set({ ...withSnapshot(state, document, duplicate.id), notice: { tone: "success", message: `${duplicate.code} duplicated.` } })
    return duplicate.id
  },
  deleteNode: (id) => set((state) => {
    if (id === state.document.rootId || !state.document.nodes[id]) return state
    const document = clone(state.document)
    const parentId = document.nodes[id].parentId ?? document.rootId
    const ids = [id, ...descendantsOf(document, id).map((node) => node.id)]
    ids.forEach((nodeId) => delete document.nodes[nodeId])
    autoLayoutTree(document, parentId)
    const nextScope = ids.includes(state.scopeId) ? parentId : state.scopeId
    const selectedId = ids.includes(state.selectedId) ? parentId : state.selectedId
    return { ...withSnapshot(state, document, selectedId), scopeId: nextScope, fitRequest: state.fitRequest + 1, notice: { tone: "info", message: "Component and its children removed." } }
  }),
  generateHalls: (requestedCount, _requestedGap) => set((state) => {
    const count = Math.min(8, Math.max(1, Math.round(requestedCount)))
    const document = clone(state.document)
    const warehouse = document.nodes[document.rootId]
    childrenOf(document, warehouse.id).filter((node) => node.type === "hall").forEach((hall) => {
      ;[hall, ...descendantsOf(document, hall.id)].forEach((node) => delete document.nodes[node.id])
    })
    for (let index = 0; index < count; index += 1) {
      const number = String(index + 1).padStart(2, "0")
      addGenerated(document, "hall", warehouse.id, {
        id: `generated-hall-${index + 1}`, code: `HL${number}`, name: `Storage Hall ${number}`,
        x: 0, y: 0, width: UNIT.hall.width, depth: UNIT.hall.depth, height: warehouse.height,
      })
    }
    autoLayoutTree(document, warehouse.id)
    return { ...withSnapshot(state, document, "generated-hall-1"), scopeId: warehouse.id, studioMode: "building", leftTab: "hierarchy", fitRequest: state.fitRequest + 1, notice: { tone: "success", message: `${count} contained halls generated.` } }
  }),
  generateStorageLayout: (hallId, requested) => set((state) => {
    const hall = state.document.nodes[hallId]
    if (!hall || !["hall", "room"].includes(hall.type)) return state
    const options = {
      aisles: Math.min(8, Math.max(1, Math.round(requested.aisles))),
      racks: Math.min(12, Math.max(1, Math.round(requested.racks))),
      shelves: Math.min(12, Math.max(1, Math.round(requested.shelves))),
      bins: Math.min(20, Math.max(1, Math.round(requested.bins))),
      rackWidth: Math.max(1, requested.rackWidth ?? 12),
      rackDepth: Math.max(1, requested.rackDepth ?? 42),
      rackHeight: Math.max(1, requested.rackHeight ?? 12),
      faces: requested.faces ?? 2,
    }
    const document = clone(state.document)
    childrenOf(document, hallId).filter((node) => node.type === "aisle").forEach((aisle) => {
      ;[aisle, ...descendantsOf(document, aisle.id)].forEach((node) => delete document.nodes[node.id])
    })
    const side = roundFeet(Math.min(3, hall.width * 0.04))
    const aisleGap = roundFeet(Math.min(6, hall.width * 0.04))
    const aisleWidth = roundFeet(Math.max(6, (hall.width - side * 2 - aisleGap * (options.aisles - 1)) / options.aisles))
    const aisleDepth = roundFeet(Math.max(24, hall.depth - 66))
    for (let aisleIndex = 0; aisleIndex < options.aisles; aisleIndex += 1) {
      const aisleNumber = String(aisleIndex + 1).padStart(2, "0")
      const aisleCode = `${hall.code}-AV${aisleNumber}`
      const aisle = addGenerated(document, "aisle", hall.id, {
        id: `${hall.id}-aisle-${aisleIndex + 1}`, code: aisleCode, name: `Storage Aisle ${aisleNumber}`,
        x: roundFeet(side + aisleIndex * (aisleWidth + aisleGap)), y: 8, width: aisleWidth, depth: aisleDepth,
      })
      const rackWidth = roundFeet(Math.min(options.rackWidth, Math.max(1, aisle.width - 2)))
      const rackDepth = roundFeet(Math.min(options.rackDepth, Math.max(2, (aisle.depth - 20) / options.racks * 0.8)))
      const rackGap = options.racks === 1 ? 0 : roundFeet(Math.max(2, (aisle.depth - 20 - rackDepth * options.racks) / (options.racks - 1)))
      for (let rackIndex = 0; rackIndex < options.racks; rackIndex += 1) {
        const rackNumber = String(rackIndex + 1).padStart(2, "0")
        const rackCode = `${aisleCode}-R${rackNumber}`
        const rack = addGenerated(document, "rack", aisle.id, {
          id: `${aisle.id}-rack-${rackIndex + 1}`, code: rackCode, name: `Rack ${rackNumber}`,
          x: roundFeet((aisle.width - rackWidth) / 2), y: roundFeet(10 + rackIndex * (rackDepth + rackGap)), width: rackWidth, depth: rackDepth,
          height: options.rackHeight, faces: options.faces, shelves: options.shelves, binsPerShelf: options.bins,
        })
        const shelfWidth = roundFeet(Math.max(2, rack.width - 1))
        const shelfDepth = roundFeet(Math.min(6, Math.max(2.5, (rack.depth - 4) / Math.max(1, options.shelves) * 0.72)))
        const shelfGap = options.shelves === 1 ? 0 : roundFeet(Math.max(0.8, (rack.depth - 4 - shelfDepth * options.shelves) / (options.shelves - 1)))
        for (let shelfIndex = 0; shelfIndex < options.shelves; shelfIndex += 1) {
          const shelfNumber = String(shelfIndex + 1).padStart(2, "0")
          const shelfCode = `${rackCode}-S${shelfNumber}`
          const shelf = addGenerated(document, "shelf", rack.id, {
            id: `${rack.id}-shelf-${shelfIndex + 1}`, code: shelfCode, name: `Shelf ${shelfNumber}`,
            x: 0.5, y: roundFeet(2 + shelfIndex * (shelfDepth + shelfGap)), width: shelfWidth, depth: shelfDepth, height: 1.2,
          })
          const binGap = roundFeet(Math.max(0.25, Math.min(0.6, shelf.width * 0.03)))
          const binWidth = roundFeet(Math.max(2.2, (shelf.width - binGap * (options.bins + 1)) / options.bins))
          const binDepth = roundFeet(Math.max(2.2, Math.min(shelf.depth - 0.4, shelf.depth * 0.78)))
          for (let binIndex = 0; binIndex < options.bins; binIndex += 1) {
            const binNumber = String(binIndex + 1).padStart(2, "0")
            addGenerated(document, "bin", shelf.id, {
              id: `${shelf.id}-bin-${binIndex + 1}`, code: `${shelfCode}-B${binNumber}`, name: `Bin ${binNumber}`,
              x: roundFeet(binGap + binIndex * (binWidth + binGap)), y: roundFeet(Math.max(0.2, (shelf.depth - binDepth) / 2)),
              width: binWidth, depth: binDepth, height: 1.2,
            })
          }
        }
      }
    }
    autoLayoutTree(document, hallId)
    return { ...withSnapshot(state, document, hall.id), scopeId: hall.id, studioMode: "storage", leftTab: "hierarchy", fitRequest: state.fitRequest + 1, notice: { tone: "success", message: `Storage generated: ${options.aisles} aisles, ${options.aisles * options.racks} racks and trackable bins.` } }
  }),
  undo: () => set((state) => {
    const previous = state.past.at(-1)
    if (!previous) return state
    return { document: clone(previous), past: state.past.slice(0, -1), future: [clone(state.document), ...state.future].slice(0, 40), selectedId: previous.nodes[state.selectedId] ? state.selectedId : previous.rootId, scopeId: previous.nodes[state.scopeId] ? state.scopeId : previous.rootId, fitRequest: state.fitRequest + 1 }
  }),
  redo: () => set((state) => {
    const next = state.future[0]
    if (!next) return state
    return { document: clone(next), past: [...state.past, clone(state.document)].slice(-40), future: state.future.slice(1), selectedId: next.nodes[state.selectedId] ? state.selectedId : next.rootId, scopeId: next.nodes[state.scopeId] ? state.scopeId : next.rootId, fitRequest: state.fitRequest + 1 }
  }),
  loadSample: () => set((state) => ({ ...withSnapshot(state, createSampleDocument(), "sample-hall-1"), scopeId: "sample-hall-1", studioMode: "storage", wizardStep: 3, leftTab: "hierarchy", fitRequest: state.fitRequest + 1, notice: { tone: "success", message: "Screenshot-inspired sample loaded." } })),
  clearDocument: () => set((state) => ({ ...withSnapshot(state, createEmptyDocument(), "warehouse-root"), scopeId: "warehouse-root", studioMode: "building", wizardStep: 2, fitRequest: state.fitRequest + 1, notice: { tone: "info", message: "Empty warehouse restored." } })),
  resetWarehouse: () => set((state) => ({
    document: createEmptyDocument(),
    selectedId: "warehouse-root",
    scopeId: "warehouse-root",
    studioMode: "building",
    wizardStep: 2,
    leftTab: "library",
    past: [],
    future: [],
    fitRequest: state.fitRequest + 1,
    notice: { tone: "info", message: "Warehouse cleared — build from scratch, or continue to reload defaults." },
  })),
  seedDefaultIfNeeded: () => {
    if (typeof process !== "undefined" && process.env.VITEST) return
    const state = get()
    if (Object.keys(state.document.nodes).length > 1) return
    window.setTimeout(() => {
      const latest = get()
      if (Object.keys(latest.document.nodes).length > 1) return
      set({
        document: getDefaultDocument(),
        selectedId: "warehouse-root",
        scopeId: "warehouse-root",
        fitRequest: latest.fitRequest + 1,
        notice: null,
      })
    }, 0)
  },
}))
