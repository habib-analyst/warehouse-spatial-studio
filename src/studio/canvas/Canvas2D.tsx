import type Konva from "konva"
import { Copy, Minus, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Group, Layer, Rect, Stage } from "react-konva"
import { ALLOWED_CHILDREN, ancestorsOf, buildChildrenIndex, canParent, indexedChildren, NODE_LABELS, type NodeType, type StudioNode } from "../model"
import { useStudioStore } from "../store"
import { CanvasTreeOverlay } from "../components/CanvasTreeOverlay"
import { absolutePosition, fitView, pointToParentLocal, zoomAtPointer } from "./canvasMath"
import { DimensionLayer } from "./DimensionLayer"
import { GridLayer } from "./GridLayer"
import { NodeShape } from "./NodeShape"

function useElementSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 800, height: 560 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}

const VISIBLE_BY_SCOPE: Record<NodeType, NodeType[]> = {
  warehouse: ["hall", "room", "openStore", "gate", "shutter"],
  hall: ["aisle", "rack", "openStore", "zone", "gate", "shutter"],
  room: ["aisle", "rack", "openStore", "zone", "gate", "shutter"],
  aisle: ["rack"],
  rack: ["shelf", "bin"],
  shelf: ["bin"],
  openStore: [], zone: [], gate: [], shutter: [], bin: [],
}

/** Direct children for most scopes; rack also shows bins under shelves. */
function visibleNodesForScope(index: Map<string, StudioNode[]>, scope: StudioNode) {
  const allowed = new Set(VISIBLE_BY_SCOPE[scope.type])
  const direct = indexedChildren(index, scope.id).filter((node) => allowed.has(node.type))
  if (scope.type !== "rack") return direct
  const bins: StudioNode[] = []
  for (const shelf of direct.filter((node) => node.type === "shelf")) {
    for (const bin of indexedChildren(index, shelf.id)) {
      if (bin.type === "bin") bins.push(bin)
    }
  }
  return [...direct, ...bins]
}

export function Canvas2D({ fitToken }: { fitToken: number }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const size = useElementSize(hostRef)
  const document = useStudioStore((state) => state.document)
  const scopeId = useStudioStore((state) => state.scopeId)
  const selectedId = useStudioStore((state) => state.selectedId)
  const tool = useStudioStore((state) => state.tool)
  const toggles = useStudioStore((state) => state.toggles)
  const zoom2D = useStudioStore((state) => state.zoom2D)
  const setZoom2D = useStudioStore((state) => state.setZoom2D)
  const setFreePlace = useStudioStore((state) => state.setFreePlace)
  const selectNode = useStudioStore((state) => state.selectNode)
  const setScope = useStudioStore((state) => state.setScope)
  const addNode = useStudioStore((state) => state.addNode)
  const moveNode = useStudioStore((state) => state.moveNode)
  const resizeNode = useStudioStore((state) => state.resizeNode)
  const deleteNode = useStudioStore((state) => state.deleteNode)
  const duplicateNode = useStudioStore((state) => state.duplicateNode)
  const childIndex = useMemo(() => buildChildrenIndex(document), [document])
  const scope = document.nodes[scopeId] ?? document.nodes[document.rootId]
  const selected = document.nodes[selectedId] ?? scope
  const detailScope = ["rack", "shelf", "bin", "aisle"].includes(scope.type)
  const fitPadding = detailScope ? 36 : 28
  const [view, setView] = useState(() => fitView(size, { width: Math.max(8, scope.width), depth: Math.max(8, scope.depth) }, fitPadding))
  const scopeAbsolute = absolutePosition(document, scope.id)
  const path = ancestorsOf(document, scope.id).map((node) => node.code).join(" / ")
  const allowedChildren = ALLOWED_CHILDREN[selected.type] ?? []
  const addTargetId = allowedChildren.length ? selected.id : (selected.parentId && (ALLOWED_CHILDREN[document.nodes[selected.parentId]?.type] ?? []).length ? selected.parentId : selected.id)
  const addTarget = document.nodes[addTargetId] ?? selected
  const addTypes = ALLOWED_CHILDREN[addTarget.type] ?? []

  useEffect(() => {
    const world = { width: Math.max(8, scope.width), depth: Math.max(8, scope.depth) }
    const next = fitView(size, world, fitPadding)
    setView(next)
    setZoom2D(next.scale)
  }, [fitToken, size.width, size.height, scope.id, scope.width, scope.depth, fitPadding, setZoom2D])

  useEffect(() => {
    if (Math.abs(view.scale - zoom2D) < 0.001) return
    const center = { x: size.width / 2, y: size.height / 2 }
    setView((current) => zoomAtPointer(current, center, zoom2D))
  }, [zoom2D, size.width, size.height, view.scale])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Alt") setFreePlace(true) }
    const onKeyUp = (event: KeyboardEvent) => { if (event.key === "Alt") setFreePlace(false) }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      setFreePlace(false)
    }
  }, [setFreePlace])

  const zoomBy = (factor: number) => {
    const center = { x: size.width / 2, y: size.height / 2 }
    const scale = Math.min(80, Math.max(0.08, view.scale * factor))
    const next = zoomAtPointer(view, center, scale)
    setView(next)
    setZoom2D(scale)
  }

  const fitNow = () => {
    const next = fitView(size, { width: Math.max(8, scope.width), depth: Math.max(8, scope.depth) }, fitPadding)
    setView(next)
    setZoom2D(next.scale)
  }

  const visibleNodes = useMemo(
    () => visibleNodesForScope(childIndex, scope),
    [childIndex, scope],
  )

  const dropTargets = useMemo(() => {
    const allowed = new Set(VISIBLE_BY_SCOPE[scope.type])
    return [scope, ...indexedChildren(childIndex, scope.id).filter((node) => allowed.has(node.type) || canParent(node.type, "bin"))]
  }, [childIndex, scope])

  const toScopePoint = (nodeId: string) => {
    const absolute = absolutePosition(document, nodeId)
    return { x: absolute.x - scopeAbsolute.x, y: absolute.y - scopeAbsolute.y }
  }

  const parentOffsetInScope = (nodeId: string) => {
    const node = document.nodes[nodeId]
    const parent = node.parentId ? absolutePosition(document, node.parentId) : scopeAbsolute
    return { x: parent.x - scopeAbsolute.x, y: parent.y - scopeAbsolute.y }
  }

  const deepestParentAt = (type: NodeType, world: { x: number; y: number }) => {
    const candidates = dropTargets
      .filter((node) => canParent(node.type, type))
      .filter((node) => {
        const pos = toScopePoint(node.id)
        return world.x >= pos.x && world.y >= pos.y && world.x <= pos.x + node.width && world.y <= pos.y + node.depth
      })
      .sort((a, b) => a.width * a.depth - b.width * b.depth)
    return candidates[0]
  }

  const screenToWorld = (clientX: number, clientY: number) => {
    const rect = hostRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left - view.offsetX) / view.scale,
      y: (clientY - rect.top - view.offsetY) / view.scale,
    }
  }

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const type = event.dataTransfer.getData("application/x-sanwa-studio-node") as NodeType
    if (!type) return
    const aisleOrientation = event.dataTransfer.getData("application/x-sanwa-aisle-orientation") as "vertical" | "horizontal" | ""
    const options = type === "aisle" && (aisleOrientation === "vertical" || aisleOrientation === "horizontal")
      ? { aisleOrientation }
      : undefined
    const world = screenToWorld(event.clientX, event.clientY)
    const parent = deepestParentAt(type, world)
    if (!parent) { addNode(type, undefined, undefined, options); return }
    const absoluteWorld = { x: world.x + scopeAbsolute.x, y: world.y + scopeAbsolute.y }
    addNode(type, parent.id, pointToParentLocal(document, parent.id, absoluteWorld), options)
  }

  const onWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()
    if (!pointer) return
    const factor = event.evt.deltaY > 0 ? 0.88 : 1.12
    const scale = Math.min(80, Math.max(0.08, view.scale * factor))
    const worldX = (pointer.x - view.offsetX) / view.scale
    const worldY = (pointer.y - view.offsetY) / view.scale
    const next = { scale, offsetX: pointer.x - worldX * scale, offsetY: pointer.y - worldY * scale }
    setView(next)
    setZoom2D(scale)
  }

  const parent = selected.parentId ? document.nodes[selected.parentId] : null

  return <div ref={hostRef} className="canvas-host" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
    <div className="canvas-guide-bar">
      <div className="canvas-crumbs">{path}</div>
      <div className="canvas-inline-actions">
        {addTypes.map((type) => type === "aisle" ? (
          <span key="aisle-pair" className="aisle-add-pair">
            <button type="button" onClick={() => addNode("aisle", addTarget.id, undefined, { aisleOrientation: "vertical" })}><Plus size={12} />Vertical aisle</button>
            <button type="button" onClick={() => addNode("aisle", addTarget.id, undefined, { aisleOrientation: "horizontal" })}><Plus size={12} />Horizontal aisle</button>
          </span>
        ) : (
          <button key={type} type="button" onClick={() => addNode(type, addTarget.id)}><Plus size={12} />Add {NODE_LABELS[type]}</button>
        ))}
        {selected.type !== "warehouse" && <>
          <button type="button" onClick={() => duplicateNode(selected.id)}><Copy size={12} />Duplicate</button>
          <button type="button" className="danger" onClick={() => deleteNode(selected.id)}><Trash2 size={12} />Delete</button>
        </>}
        {parent && <button type="button" onClick={() => setScope(parent.id)}>Back to {parent.code}</button>}
      </div>
    </div>
    <CanvasTreeOverlay />
    <Stage
      ref={stageRef}
      width={size.width}
      height={size.height}
      onWheel={onWheel}
      draggable={tool === "pan"}
      onDragEnd={(event) => { if (event.target === stageRef.current) setView((current) => ({ ...current, offsetX: event.target.x(), offsetY: event.target.y() })) }}
      onMouseDown={(event) => { if (event.target === event.target.getStage()) selectNode(scope.id) }}
      x={view.offsetX}
      y={view.offsetY}
      scaleX={view.scale}
      scaleY={view.scale}
    >
      <Layer>
        <Group>
          <Rect x={0} y={0} width={scope.width} height={scope.depth} fill="#fbfdff" stroke="#334b69" strokeWidth={1.2 / view.scale} shadowColor="#4b607a" shadowBlur={6} shadowOpacity={0.12} />
          <GridLayer width={scope.width} depth={scope.depth} visible={toggles.grid} />
          <Rect x={2} y={2} width={scope.width - 4} height={scope.depth - 4} stroke="#9badc2" strokeWidth={0.45 / view.scale} listening={false} />
          <DimensionLayer width={scope.width} depth={scope.depth} visible={toggles.dimensions} />
          {visibleNodes.map((node) => {
            const point = toScopePoint(node.id)
            const parentOffset = parentOffsetInScope(node.id)
            const pxArea = node.width * view.scale * node.depth * view.scale
            const showLabel = toggles.labels && (
              selectedId === node.id
              || ["hall", "room", "zone", "shelf", "bin", "rack"].includes(node.type)
              || pxArea >= 900
              || view.scale >= 1
            )
            return <NodeShape
              key={node.id}
              node={node}
              x={point.x}
              y={point.y}
              selected={selectedId === node.id}
              showLabel={showLabel}
              scale={view.scale}
              draggable={tool === "select"}
              onSelect={() => selectNode(node.id)}
              onOpen={() => !["bin", "shutter", "gate", "openStore", "zone"].includes(node.type) && setScope(node.id)}
              onMove={(next) => moveNode(node.id, { x: next.x - parentOffset.x, y: next.y - parentOffset.y })}
              onResize={(box) => resizeNode(node.id, { x: box.x - parentOffset.x, y: box.y - parentOffset.y, width: box.width, depth: box.depth })}
            />
          })}
        </Group>
      </Layer>
    </Stage>
    <div className="canvas-compass"><span>N</span><b>▲</b></div>
    <div className="canvas-zoom-dock" aria-label="Canvas zoom">
      <button type="button" aria-label="Zoom out" onClick={() => zoomBy(0.82)}><Minus size={14} /></button>
      <span>{Math.round(view.scale * 100)}%</span>
      <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.22)}><Plus size={14} /></button>
      <button type="button" className="fit" onClick={fitNow}>Fit</button>
    </div>
  </div>
}
