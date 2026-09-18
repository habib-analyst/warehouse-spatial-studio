import { ChevronDown, ChevronRight, Circle, Eye, LockKeyhole, Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { ALLOWED_CHILDREN, ancestorsOf, buildChildrenIndex, indexedChildren, NODE_LABELS, type StudioNode } from "../model"
import { useStudioStore } from "../store"

const OPENABLE = new Set(["warehouse", "hall", "room", "aisle", "rack", "shelf"])

function TreeNode({
  node,
  depth,
  openIds,
  setOpenIds,
  index,
}: {
  node: StudioNode
  depth: number
  openIds: Set<string>
  setOpenIds: (ids: Set<string>) => void
  index: ReturnType<typeof buildChildrenIndex>
}) {
  const { selectedId, scopeId, selectNode, setScope, addNode } = useStudioStore()
  const children = indexedChildren(index, node.id).slice().sort((a, b) => a.code.localeCompare(b.code))
  const open = openIds.has(node.id)
  const allowed = ALLOWED_CHILDREN[node.type]
  const toggle = () => {
    const next = new Set(openIds)
    if (next.has(node.id)) next.delete(node.id)
    else next.add(node.id)
    setOpenIds(next)
  }
  return (
    <li>
      <div className={`tree-row ${selectedId === node.id ? "selected" : ""} ${scopeId === node.id ? "scoped" : ""}`} style={{ paddingInlineStart: 8 + depth * 14 }}>
        <button className="tree-expander" aria-label={`${open ? "Collapse" : "Expand"} ${node.code}`} onClick={toggle} disabled={!children.length}>
          {children.length ? open ? <ChevronDown size={13} /> : <ChevronRight size={13} /> : <Circle size={5} fill="currentColor" />}
        </button>
        <button
          className="tree-main"
          onClick={() => selectNode(node.id)}
          onDoubleClick={() => OPENABLE.has(node.type) && setScope(node.id)}
        >
          <span className={`tree-type type-${node.type}`} />
          <span>
            <strong>{node.code}</strong>
            <small>{node.name || NODE_LABELS[node.type]} · {node.width.toFixed(0)}×{node.depth.toFixed(0)} ft</small>
          </span>
        </button>
        {node.locked ? <LockKeyhole size={12} /> : <Eye size={12} />}
      </div>
      {!!allowed.length && selectedId === node.id && (
        <div className="tree-add-row" style={{ paddingInlineStart: 28 + depth * 14 }}>
          {allowed.map((type) => type === "aisle" ? (
            <span key="aisle-pair" className="aisle-add-pair">
              <button onClick={() => addNode("aisle", node.id, undefined, { aisleOrientation: "vertical" })}><Plus size={10} />Vertical aisle</button>
              <button onClick={() => addNode("aisle", node.id, undefined, { aisleOrientation: "horizontal" })}><Plus size={10} />Horizontal aisle</button>
            </span>
          ) : (
            <button key={type} onClick={() => addNode(type, node.id)}><Plus size={10} />{NODE_LABELS[type]}</button>
          ))}
        </div>
      )}
      {open && children.length > 0 && (
        <ul>{children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} openIds={openIds} setOpenIds={setOpenIds} index={index} />)}</ul>
      )}
    </li>
  )
}

export function HierarchyTree() {
  const { document, selectedId, scopeId } = useStudioStore()
  const index = useMemo(() => buildChildrenIndex(document), [document])
  const pathIds = useMemo(() => new Set(ancestorsOf(document, selectedId || scopeId).map((node) => node.id)), [document, selectedId, scopeId])
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([document.rootId, ...pathIds]))

  useEffect(() => {
    setOpenIds((current) => {
      const next = new Set(current)
      pathIds.forEach((id) => next.add(id))
      next.add(document.rootId)
      return next
    })
  }, [pathIds, document.rootId])

  return (
    <div className="hierarchy-tree-wrap">
      <p className="hierarchy-hint">Click to select · double-click to open on canvas · expand to see every child</p>
      <ul className="hierarchy-tree">
        <TreeNode node={document.nodes[document.rootId]} depth={0} openIds={openIds} setOpenIds={setOpenIds} index={index} />
      </ul>
    </div>
  )
}
