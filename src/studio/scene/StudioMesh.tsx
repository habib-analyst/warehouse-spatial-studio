import { Edges, Html } from "@react-three/drei"
import type { ThreeEvent } from "@react-three/fiber"
import type { StudioNode } from "../model"
import type { SceneTransform } from "./sceneGeometry"

const MATERIALS: Record<StudioNode["type"], { color: string; opacity: number; edge: string }> = {
  warehouse: { color: "#f8fbff", opacity: 1, edge: "#334155" },
  hall: { color: "#bfdbfe", opacity: 0.2, edge: "#4f6b8d" },
  room: { color: "#dbe4ef", opacity: 0.3, edge: "#64748b" },
  aisle: { color: "#dbeafe", opacity: 0.36, edge: "#6b9ee5" },
  rack: { color: "#cbd5e1", opacity: 0.93, edge: "#475569" },
  shelf: { color: "#60a5fa", opacity: 0.9, edge: "#1d4ed8" },
  bin: { color: "#a78bfa", opacity: 0.92, edge: "#6d28d9" },
  openStore: { color: "#93c5fd", opacity: 0.52, edge: "#3b82f6" },
  zone: { color: "#67e8f9", opacity: 0.64, edge: "#0891b2" },
  gate: { color: "#6ee7b7", opacity: 0.72, edge: "#047857" },
  shutter: { color: "#67e8f9", opacity: 0.78, edge: "#0e7490" },
}

type Props = {
  node: StudioNode
  transform: SceneTransform
  selected: boolean
  showLabel: boolean
  onSelect: () => void
  onOpen: () => void
}

function MeshLabel({ node, selected, y, distanceFactor }: { node: StudioNode; selected: boolean; y: number; distanceFactor: number }) {
  const short = node.code.split("-").at(-1) ?? node.code
  const showName = !["bin", "shelf", "rack"].includes(node.type) && node.width >= 16
  return <Html center position={[0, y, 0]} distanceFactor={distanceFactor} style={{ pointerEvents: "none" }}>
    <div className={`mesh-label type-${node.type} ${selected ? "selected" : ""}`}>
      <strong>{short}</strong>
      {showName && <span>{node.name}</span>}
    </div>
  </Html>
}

export function StudioMesh({ node, transform, selected, showLabel, onSelect, onOpen }: Props) {
  const material = node.type === "zone" && node.color ? { color: node.color, opacity: 0.68, edge: node.color } : MATERIALS[node.type]
  const onClick = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect() }
  const isContainer = node.type === "hall" || node.type === "room"
  const minShelf = node.type === "shelf" ? Math.max(transform.scale[2], 2.4) : transform.scale[2]
  const minBin = node.type === "bin" ? [Math.max(transform.scale[0], 2.2), Math.max(transform.scale[1], 1), Math.max(transform.scale[2], 2.2)] as [number, number, number] : null
  const scale: [number, number, number] = isContainer
    ? [transform.scale[0], 0.6, transform.scale[2]]
    : node.type === "shelf"
      ? [transform.scale[0], Math.max(0.45, transform.scale[1]), minShelf]
      : minBin ?? transform.scale
  const position: [number, number, number] = isContainer ? [transform.position[0], 0.3, transform.position[2]] : transform.position
  const labelDistance = node.type === "bin" ? 28 : node.type === "shelf" ? 36 : node.type === "rack" ? 55 : 80

  if (node.type === "rack") {
    const shelves = Math.min(7, Math.max(3, node.shelves ?? 6))
    const postX = transform.scale[0] / 2 - 0.3
    const postZ = transform.scale[2] / 2 - 0.3
    return <group position={position} rotation={[0, -node.rotation * Math.PI / 180, 0]} onClick={onClick} onDoubleClick={(event) => { event.stopPropagation(); onOpen() }}>
      {([[-postX, -postZ], [postX, -postZ], [-postX, postZ], [postX, postZ]] as Array<[number, number]>).map(([x, z], index) => (
        <mesh key={`post-${index}`} position={[x, 0, z]} scale={[0.55, transform.scale[1], 0.55]} castShadow>
          <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={selected ? "#3b82f6" : "#64748b"} roughness={0.68} />
        </mesh>
      ))}
      {Array.from({ length: shelves }, (_, index) => {
        const y = -transform.scale[1] / 2 + 0.35 + index * ((transform.scale[1] - 0.7) / Math.max(1, shelves - 1))
        return <mesh key={`shelf-${index}`} position={[0, y, 0]} scale={[transform.scale[0], 0.32, transform.scale[2]]} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={selected ? "#93c5fd" : "#cbd5e1"} roughness={0.76} />
        </mesh>
      })}
      {showLabel && <MeshLabel node={node} selected={selected} y={transform.scale[1] / 2 + 1.6} distanceFactor={labelDistance} />}
    </group>
  }

  return <mesh position={position} scale={scale} rotation={[0, -node.rotation * Math.PI / 180, 0]} onClick={onClick} onDoubleClick={(event) => { event.stopPropagation(); onOpen() }} castShadow={!isContainer} receiveShadow>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={selected ? "#60a5fa" : material.color} transparent opacity={selected ? 0.82 : material.opacity} roughness={0.72} metalness={0.02} depthWrite={!isContainer} />
    <Edges color={selected ? "#1677ff" : material.edge} lineWidth={selected ? 2 : 1} />
    {showLabel && <MeshLabel node={node} selected={selected} y={scale[1] / 2 + 0.55} distanceFactor={labelDistance} />}
  </mesh>
}
