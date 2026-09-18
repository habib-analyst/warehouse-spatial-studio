import { lazy, Suspense, useEffect, useState } from "react"
import { ContextToolbar } from "./components/ContextToolbar"
import { Canvas2D } from "./canvas/Canvas2D"
import { DetailsStep } from "./components/DetailsStep"
import { LibraryPanel } from "./components/LibraryPanel"
import { InspectorPanel } from "./components/InspectorPanel"
import { ReviewStep } from "./components/ReviewStep"
import { CreateProgress } from "./components/CreateStepChrome"
import { useStudioStore } from "./store"

const Scene3D = lazy(() => import("./scene/Scene3D").then((module) => ({ default: module.Scene3D })))

export function StudioShell() {
  const [fitToken, setFitToken] = useState(0)
  const { document, viewMode, wizardStep, notice, selectedId, deleteNode, fitRequest, seedDefaultIfNeeded, leftSidebarOpen } = useStudioStore()
  const empty = Object.keys(document.nodes).length === 1
  const spatial = wizardStep === 2

  useEffect(() => {
    if (wizardStep >= 2) seedDefaultIfNeeded()
  }, [wizardStep, seedDefaultIfNeeded])

  useEffect(() => {
    setFitToken((token) => token + 1)
  }, [fitRequest])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!spatial) return
      if ((event.key === "Delete" || event.key === "Backspace") && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLSelectElement)) {
        const node = document.nodes[selectedId]
        if (node && node.type !== "warehouse") {
          event.preventDefault()
          deleteNode(selectedId)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [spatial, selectedId, document.nodes, deleteNode])

  return (
    <section className="studio-card" aria-label="Warehouse Spatial Studio">
      <CreateProgress />
      {wizardStep === 1 && <DetailsStep />}
      {wizardStep === 3 && <ReviewStep />}
      {spatial && <>
        <div className={`studio-workspace ${leftSidebarOpen ? "" : "left-collapsed"}`}>
          <LibraryPanel />
          <section className="canvas-column">
            <ContextToolbar />
            {viewMode === "2d" ? (
              <Canvas2D fitToken={fitToken} />
            ) : (
              <Suspense fallback={<div className="scene-loading">Loading 3D preview…</div>}>
                <Scene3D />
              </Suspense>
            )}
            {empty && <div className="empty-canvas-callout">Empty warehouse — add a hall or room to begin</div>}
            {notice && <div className={`studio-notice ${notice.tone}`}>{notice.message}</div>}
          </section>
          <InspectorPanel />
        </div>
      </>}
    </section>
  )
}
