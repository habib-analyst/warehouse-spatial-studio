import { ListTree, SlidersHorizontal } from "lucide-react"
import { useStudioStore } from "../store"
import { HierarchyExplorer } from "./HierarchyExplorer"
import { PropertiesPanel } from "./PropertiesPanel"

export function InspectorPanel() {
  const { rightTab, setRightTab } = useStudioStore()
  if (rightTab === "closed") return null
  return <aside className="inspector-panel">
    <div className="inspector-tabs">
      <button aria-label="Properties inspector" className={rightTab === "properties" ? "active" : ""} onClick={() => setRightTab("properties")}><SlidersHorizontal size={13} />Properties</button>
      <button aria-label="Tree explorer" className={rightTab === "tree" ? "active" : ""} onClick={() => setRightTab("tree")}><ListTree size={13} />Tree</button>
    </div>
    {rightTab === "properties" ? <PropertiesPanel /> : <HierarchyExplorer />}
  </aside>
}
