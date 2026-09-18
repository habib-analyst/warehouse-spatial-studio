import { Map, Trash2 } from "lucide-react"
import { useStudioStore } from "../store"
import { HierarchyTree } from "./HierarchyTree"

export function HierarchyExplorer() {
  const { document, selectedId, deleteNode } = useStudioStore()
  const selected = document.nodes[selectedId] ?? document.nodes[document.rootId]

  return (
    <section className="hierarchy-explorer hierarchy-explorer-tree">
      <header>
        <div><h2>Location hierarchy</h2><p>Warehouse to bin — expand any level</p></div>
        <Map size={17} />
      </header>
      <div className="hierarchy-tree-scroll">
        <HierarchyTree />
      </div>
      <footer>
        <span className={`explorer-kind type-${selected.type}`} />
        <div><strong>{selected.code}</strong><small>{selected.name}</small></div>
        <button
          type="button"
          className="explorer-delete"
          aria-label={`Delete ${selected.code}`}
          disabled={selected.type === "warehouse"}
          onClick={() => deleteNode(selected.id)}
        >
          <Trash2 size={12} />Delete
        </button>
      </footer>
    </section>
  )
}
