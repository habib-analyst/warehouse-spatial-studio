import { Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Minus, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { buildChildrenIndex, indexedChildren, type NodeType, type StudioDocument, type StudioNode } from "../model"
import { useStudioStore } from "../store"
import { CanvasTreeOverlay } from "../components/CanvasTreeOverlay"
import { nodeSceneTransform } from "./sceneGeometry"
import { StudioMesh } from "./StudioMesh"

const VISIBLE_BY_SCOPE: Record<NodeType, NodeType[]> = {
  warehouse: ["hall", "room", "openStore", "gate", "shutter"],
  hall: ["aisle", "rack", "openStore", "zone", "gate", "shutter"],
  room: ["aisle", "rack", "openStore", "zone", "gate", "shutter"],
  aisle: ["rack"], rack: ["shelf", "bin"], shelf: ["bin"],
  openStore: [], zone: [], gate: [], shutter: [], bin: [],
}

function visibleForScope(document: StudioDocument, scope: StudioNode) {
  const allowed = new Set(VISIBLE_BY_SCOPE[scope.type])
  const index = buildChildrenIndex(document)
  const direct = indexedChildren(index, scope.id).filter((node) => allowed.has(node.type))
  if (scope.type !== "rack") return direct
  const bins: StudioNode[] = []
  for (const shelf of direct.filter((node) => node.type === "shelf")) {
    for (const bin of indexedChildren(index, shelf.id)) if (bin.type === "bin") bins.push(bin)
  }
  return [...direct, ...bins]
}

function BoundaryWalls({ width, depth, height }: { width: number; depth: number; height: number }) {
  const wall = 0.9
  const y = height / 2
  return <group>
    {[
      { position: [0, y, -depth / 2] as [number, number, number], scale: [width, height, wall] as [number, number, number] },
      { position: [0, y, depth / 2] as [number, number, number], scale: [width, height, wall] as [number, number, number] },
      { position: [-width / 2, y, 0] as [number, number, number], scale: [wall, height, depth] as [number, number, number] },
      { position: [width / 2, y, 0] as [number, number, number], scale: [wall, height, depth] as [number, number, number] },
    ].map((item, index) => <mesh key={index} position={item.position} scale={item.scale} receiveShadow>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#c5d4e6" transparent opacity={0.28} roughness={0.85} />
    </mesh>)}
  </group>
}

function SceneContents({ zoom }: { zoom: number }) {
  const { document, scopeId, selectedId, toggles, selectNode, setScope } = useStudioStore()
  const scope = document.nodes[scopeId] ?? document.nodes[document.rootId]
  const visible = useMemo(() => visibleForScope(document, scope), [document, scope])
  const cameraDistance = Math.max(scope.width, scope.depth) * 0.95 / Math.max(0.35, zoom)

  return <>
    <color attach="background" args={["#eef5fb"]} />
    <fog attach="fog" args={["#eef5fb", cameraDistance * 1.4, cameraDistance * 4]} />
    <ambientLight intensity={0.85} />
    <directionalLight position={[90, 180, 70]} intensity={1.55} castShadow shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[-60, 80, -40]} intensity={0.45} />
    <hemisphereLight args={["#f0f7ff", "#9aacbf", 0.55]} />
    <Grid args={[scope.width * 1.8, scope.depth * 1.8]} cellSize={2} cellThickness={0.4} cellColor="#c9d8e8" sectionSize={10} sectionThickness={0.85} sectionColor="#8fa8c4" fadeDistance={cameraDistance * 2} fadeStrength={1.2} infiniteGrid />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow onClick={() => selectNode(scope.id)}>
      <planeGeometry args={[scope.width, scope.depth]} />
      <meshStandardMaterial color="#f7fbff" roughness={0.94} />
    </mesh>
    <BoundaryWalls width={scope.width} depth={scope.depth} height={Math.max(8, Math.min(18, scope.height))} />
    {visible.map((node) => (
      <StudioMesh
        key={node.id}
        node={node}
        transform={nodeSceneTransform(document, node.id, scope.id)}
        selected={selectedId === node.id}
        showLabel={toggles.labels}
        onSelect={() => selectNode(node.id)}
        onOpen={() => !["bin", "gate", "shutter", "openStore", "zone"].includes(node.type) && setScope(node.id)}
      />
    ))}
    <OrbitControls makeDefault target={[0, 2, 0]} minDistance={8} maxDistance={cameraDistance * 5} maxPolarAngle={Math.PI / 2.08} enableDamping dampingFactor={0.08} />
  </>
}

export function Scene3D() {
  const scope = useStudioStore((state) => state.document.nodes[state.scopeId] ?? state.document.nodes[state.document.rootId])
  const distance = Math.max(scope.width, scope.depth)
  const [zoom, setZoom] = useState(1)
  const detail = ["rack", "shelf", "bin", "aisle"].includes(scope.type)
  const camMul = (detail ? 0.42 : 0.55) / Math.max(0.35, zoom)
  return <div className="scene-host">
    <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
      <PerspectiveCamera makeDefault position={[distance * camMul, distance * camMul * 0.85, distance * camMul * 1.15]} fov={detail ? 42 : 36} near={0.1} far={distance * 12} />
      <SceneContents zoom={zoom} />
    </Canvas>
    <CanvasTreeOverlay />
    <div className="canvas-zoom-dock scene-zoom-dock" aria-label="3D zoom">
      <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.4, value * 0.85))}><Minus size={14} /></button>
      <span>{Math.round(zoom * 100)}%</span>
      <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(4, value * 1.18))}><Plus size={14} /></button>
      <button type="button" className="fit" onClick={() => setZoom(1)}>Fit</button>
    </div>
  </div>
}
