import { createPortal } from "react-dom"
import { useMemo, useState } from "react"
import { ListTree, Maximize2, Minimize2, Minus, Plus, X } from "lucide-react"
import { ancestorsOf, buildChildrenIndex, indexedChildren, NODE_LABELS, type StudioNode } from "../model"
import { useStudioStore } from "../store"

function VisualNode({
  node,
  index,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}: {
  node: StudioNode
  index: Map<string, StudioNode[]>
  selectedId: string
  expanded: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const kids = indexedChildren(index, node.id).slice().sort((a, b) => a.code.localeCompare(b.code))
  const open = expanded.has(node.id)
  return (
    <div className={`visual-node ${selectedId === node.id ? "selected" : ""}`}>
      <div className="visual-node-head">
        <button type="button" className="visual-node-card" onClick={() => onSelect(node.id)}>
          <strong>{node.code}</strong>
          <small>{NODE_LABELS[node.type]}</small>
          {kids.length > 0 && <em>{kids.length} children</em>}
        </button>
        {kids.length > 0 && (
          <button
            type="button"
            className="visual-expand"
            aria-label={`${open ? "Collapse" : "Expand"} ${node.code}`}
            onClick={() => onToggle(node.id)}
          >
            {open ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        )}
      </div>
      {open && kids.length > 0 && (
        <div className="visual-node-branch">
          <div className="visual-node-stem" aria-hidden />
          <div className="visual-node-children">
            {kids.map((child) => (
              <VisualNode
                key={child.id}
                node={child}
                index={index}
                selectedId={selectedId}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Center popup: visual tree cards; maximize fills the screen corner-to-corner. */
export function HierarchyViewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const document = useStudioStore((state) => state.document)
  const selectedId = useStudioStore((state) => state.selectedId)
  const selectNode = useStudioStore((state) => state.selectNode)
  const index = useMemo(() => buildChildrenIndex(document), [document])
  const root = document.nodes[document.rootId]
  const seedPath = useMemo(
    () => new Set([document.rootId, ...ancestorsOf(document, selectedId).map((node) => node.id), selectedId]),
    [document, selectedId],
  )
  const [expanded, setExpanded] = useState<Set<string>>(() => seedPath)
  const [maximized, setMaximized] = useState(false)

  if (!open) return null

  const close = () => {
    setMaximized(false)
    onClose()
  }

  const onToggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return createPortal(
    <div className={`hierarchy-modal-backdrop ${maximized ? "maximized" : ""}`} role="presentation" onClick={close}>
      <div
        className={`hierarchy-modal hierarchy-modal-visual ${maximized ? "is-max" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Full warehouse hierarchy"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <strong><ListTree size={15} /> Full hierarchy</strong>
          <div className="hierarchy-modal-actions">
            <button
              type="button"
              className="icon-button"
              aria-label={maximized ? "Minimize hierarchy view" : "Maximize hierarchy view"}
              onClick={() => setMaximized((value) => !value)}
            >
              {maximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button type="button" className="icon-button" aria-label="Close hierarchy view" onClick={close}><X size={16} /></button>
          </div>
        </header>
        <div className="hierarchy-modal-body visual-tree-scroll">
          <VisualNode
            node={root}
            index={index}
            selectedId={selectedId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={(id) => selectNode(id)}
          />
        </div>
      </div>
    </div>,
    globalThis.document.body,
  )
}
