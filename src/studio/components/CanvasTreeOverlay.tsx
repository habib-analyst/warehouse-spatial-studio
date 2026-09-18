import { ChevronDown, ChevronRight, Circle, Eye, ListTree, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { ancestorsOf, buildChildrenIndex, indexedChildren, NODE_LABELS } from "../model"
import { useStudioStore } from "../store"
import { HierarchyViewModal } from "./HierarchyViewModal"

/** Top-right canvas Hierarchy card: full warehouse→bin expandable tree + View popup. */
export function CanvasTreeOverlay() {
  const document = useStudioStore((state) => state.document)
  const selectedId = useStudioStore((state) => state.selectedId)
  const scopeId = useStudioStore((state) => state.scopeId)
  const showCanvasTree = useStudioStore((state) => state.showCanvasTree)
  const setShowCanvasTree = useStudioStore((state) => state.setShowCanvasTree)
  const selectNode = useStudioStore((state) => state.selectNode)
  const setScope = useStudioStore((state) => state.setScope)
  const index = useMemo(() => buildChildrenIndex(document), [document])
  const rootId = document.rootId
  const focusId = selectedId || scopeId
  const pathIds = useMemo(() => {
    const ids = ancestorsOf(document, focusId).map((node) => node.id)
    return new Set([rootId, focusId, ...ids])
  }, [document, focusId, rootId])
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(pathIds))
  const [viewOpen, setViewOpen] = useState(false)

  useEffect(() => {
    setOpenIds((current) => {
      const next = new Set(current)
      pathIds.forEach((id) => next.add(id))
      return next
    })
  }, [pathIds])

  if (!showCanvasTree) {
    return <button type="button" className="canvas-tree-toggle" onClick={() => setShowCanvasTree(true)}><ListTree size={14} />Tree</button>
  }

  const render = (nodeId: string, depth: number): React.ReactNode => {
    const node = document.nodes[nodeId]
    if (!node) return null
    const kids = indexedChildren(index, nodeId).slice().sort((a, b) => a.code.localeCompare(b.code))
    const open = openIds.has(node.id)
    const toggle = () => {
      setOpenIds((current) => {
        const next = new Set(current)
        if (next.has(node.id)) next.delete(node.id)
        else next.add(node.id)
        return next
      })
    }
    return (
      <li key={node.id}>
        <div className={`canvas-tree-row ${selectedId === node.id ? "selected" : ""} ${scopeId === node.id ? "scoped" : ""}`} style={{ paddingLeft: 4 + depth * 12 }}>
          <button type="button" className="canvas-tree-expander" aria-label={`${open ? "Collapse" : "Expand"} ${node.code}`} disabled={!kids.length} onClick={toggle}>
            {kids.length ? (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <Circle size={5} fill="currentColor" />}
          </button>
          <button
            type="button"
            className="canvas-tree-item"
            onClick={() => selectNode(node.id)}
            onDoubleClick={() => {
              if (!["bin", "gate", "shutter", "zone", "openStore"].includes(node.type)) setScope(node.id)
            }}
          >
            <strong>{node.code}</strong>
            <small>{NODE_LABELS[node.type]}{kids.length ? ` · ${kids.length}` : ""}</small>
          </button>
        </div>
        {open && kids.length > 0 && <ul>{kids.map((child) => render(child.id, depth + 1))}</ul>}
      </li>
    )
  }

  return (
    <>
      <aside className="canvas-tree-panel">
        <header>
          <strong><ListTree size={13} /> Hierarchy</strong>
          <div className="canvas-tree-header-actions">
            <button type="button" className="canvas-tree-view" aria-label="View full hierarchy" onClick={() => setViewOpen(true)}>
              <Eye size={14} />
            </button>
            <button type="button" aria-label="Hide tree" onClick={() => setShowCanvasTree(false)}><X size={13} /></button>
          </div>
        </header>
        <ul className="canvas-tree-list">{render(rootId, 0)}</ul>
      </aside>
      <HierarchyViewModal open={viewOpen} onClose={() => setViewOpen(false)} />
    </>
  )
}
