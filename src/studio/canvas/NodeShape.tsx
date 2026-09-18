import Konva from "konva"
import { memo, useEffect, useRef } from "react"
import { Group, Rect, Text, Transformer } from "react-konva"
import type { StudioNode } from "../model"

const COLORS: Record<StudioNode["type"], { fill: string; stroke: string }> = {
  warehouse: { fill: "#fbfdff", stroke: "#334b69" },
  hall: { fill: "rgba(219,234,254,.48)", stroke: "#60758f" },
  room: { fill: "rgba(226,232,240,.65)", stroke: "#64748b" },
  aisle: { fill: "rgba(239,246,255,.34)", stroke: "#96aed0" },
  rack: { fill: "#edf1f5", stroke: "#526479" },
  shelf: { fill: "#dbeafe", stroke: "#3976c7" },
  bin: { fill: "#ede9fe", stroke: "#7c3aed" },
  openStore: { fill: "rgba(191,219,254,.58)", stroke: "#4f9cf8" },
  zone: { fill: "rgba(6,182,212,.16)", stroke: "#06b6d4" },
  gate: { fill: "#d1fae5", stroke: "#059669" },
  shutter: { fill: "#cffafe", stroke: "#0891b2" },
}

type Props = {
  node: StudioNode
  x: number
  y: number
  selected: boolean
  showLabel: boolean
  scale: number
  draggable: boolean
  onSelect: () => void
  onOpen: () => void
  onMove: (point: { x: number; y: number }) => void
  onResize: (box: { x: number; y: number; width: number; depth: number }) => void
}

/** Font size in world-ft so on-screen text stays readable and inside the shape. */
export function labelFontSize(node: Pick<StudioNode, "type" | "width" | "depth">, scale: number, text: string) {
  const lines = text.split("\n")
  const longest = Math.max(1, ...lines.map((line) => line.length))
  const pad = node.type === "bin" || node.type === "shelf" ? 0.18 : 0.35
  const innerW = Math.max(0.4, node.width - pad * 2)
  const innerH = Math.max(0.4, node.depth - pad * 2)
  const byWidth = innerW / (longest * 0.62)
  const byHeight = innerH / (lines.length * 1.35)
  const screenCap = 14 / Math.max(0.2, scale)
  const screenFloor = (node.type === "bin" || node.type === "shelf" ? 9 : 8) / Math.max(0.2, scale)
  const fitted = Math.min(byWidth, byHeight, screenCap)
  if (node.type === "bin") return Math.min(Math.max(fitted, Math.min(screenFloor, byWidth, byHeight)), byWidth, byHeight)
  if (node.type === "shelf") return Math.min(Math.max(fitted, Math.min(screenFloor * 0.9, byWidth, byHeight)), byWidth, byHeight)
  if (node.type === "zone") return Math.min(2.2, fitted)
  return Math.max(0.7, Math.min(5, fitted))
}

export const NodeShape = memo(function NodeShape({ node, x, y, selected, showLabel, scale, draggable, onSelect, onOpen, onMove, onResize }: Props) {
  const shapeRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const color = node.type === "zone" && node.color ? { fill: `${node.color}24`, stroke: node.color } : COLORS[node.type]

  useEffect(() => {
    if (selected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selected, x, y, node.width, node.depth])

  const shortCode = node.code.split("-").at(-1) ?? node.code
  const pxW = node.width * scale
  const pxH = node.depth * scale
  const tiny = pxW < 28 || pxH < 16
  const codeOnly = tiny || ["rack", "aisle", "shelf", "bin", "gate", "shutter"].includes(node.type)
  const label = node.type === "zone" && !tiny
    ? `${shortCode}`
    : codeOnly
      ? shortCode
      : `${shortCode}\n${node.name}`
  const outside = ["gate", "shutter"].includes(node.type) && pxH < 18
  const fontSize = labelFontSize(node, scale, label)
  const textWidth = Math.max(0.5, node.width - (node.type === "bin" ? 0.2 : 0.5))
  const labelX = x + node.width / 2
  const labelY = outside ? y + node.depth + fontSize * 1.4 : y + node.depth / 2
  const strokeScale = Math.max(0.25, 1 / scale)
  const canShowInside = pxW >= 14 && pxH >= 10
  const drawLabel = showLabel && (canShowInside || selected || outside)

  return <>
    <Group>
      <Rect
        ref={shapeRef}
        id={`shape-${node.id}`}
        x={x}
        y={y}
        width={node.width}
        height={node.depth}
        rotation={node.rotation}
        fill={color.fill}
        stroke={selected ? "#1677ff" : color.stroke}
        strokeWidth={(selected ? 1.5 : node.type === "aisle" ? 0.65 : node.type === "bin" ? 0.8 : 1) * strokeScale}
        dash={node.type === "aisle" ? [4, 3] : undefined}
        cornerRadius={node.type === "bin" ? 0.35 : node.type === "openStore" ? 2 : 0.55}
        draggable={draggable && !node.locked}
        onClick={(event) => { event.cancelBubble = true; onSelect() }}
        onTap={(event) => { event.cancelBubble = true; onSelect() }}
        onDblClick={(event) => { event.cancelBubble = true; onOpen() }}
        onDragEnd={(event) => onMove({ x: event.target.x(), y: event.target.y() })}
        onTransformEnd={() => {
          const shape = shapeRef.current
          if (!shape) return
          const scaleX = shape.scaleX()
          const scaleY = shape.scaleY()
          shape.scaleX(1)
          shape.scaleY(1)
          onResize({
            x: shape.x(),
            y: shape.y(),
            width: Math.max(node.type === "bin" ? 1.5 : 1, node.width * scaleX),
            depth: Math.max(node.type === "bin" ? 1.5 : 1, node.depth * scaleY),
          })
        }}
      />
      {drawLabel && (
        <Text
          x={labelX}
          y={labelY}
          text={label}
          width={textWidth}
          offsetX={textWidth / 2}
          offsetY={outside ? 0 : (label.includes("\n") ? fontSize * 1.15 : fontSize * 0.55)}
          align="center"
          verticalAlign="middle"
          wrap="none"
          ellipsis
          fontSize={fontSize}
          fontStyle="bold"
          lineHeight={1.15}
          fill={selected ? "#0b4db8" : "#153b72"}
          listening={false}
        />
      )}
    </Group>
    {selected && !node.locked && <Transformer
      ref={transformerRef}
      rotateEnabled={false}
      keepRatio={false}
      flipEnabled={false}
      borderStroke="#1677ff"
      borderStrokeWidth={1 * strokeScale}
      anchorFill="#fff"
      anchorStroke="#1677ff"
      anchorStrokeWidth={1}
      anchorSize={Math.max(5, Math.min(10, 8 / scale))}
      enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"]}
      boundBoxFunc={(oldBox, newBox) => newBox.width < 2 || newBox.height < 2 ? oldBox : newBox}
    />}
  </>
})
