import { Arrow, Line, Text } from "react-konva"

export function DimensionLayer({ width, depth, visible }: { width: number; depth: number; visible: boolean }) {
  if (!visible) return null
  return <>
    <Line points={[0, -8, 0, -21]} stroke="#547099" strokeWidth={0.7} listening={false} />
    <Line points={[width, -8, width, -21]} stroke="#547099" strokeWidth={0.7} listening={false} />
    <Arrow points={[0, -17, width, -17]} pointerAtBeginning pointerWidth={3} pointerLength={3} stroke="#214f95" fill="#214f95" strokeWidth={0.7} listening={false} />
    <Text x={width / 2 - 24} y={-27} width={48} text={`${width.toFixed(2)} ft`} align="center" fontSize={5.5} fontStyle="bold" fill="#214f95" listening={false} />
    <Line points={[-8, 0, -21, 0]} stroke="#547099" strokeWidth={0.7} listening={false} />
    <Line points={[-8, depth, -21, depth]} stroke="#547099" strokeWidth={0.7} listening={false} />
    <Arrow points={[-17, 0, -17, depth]} pointerAtBeginning pointerWidth={3} pointerLength={3} stroke="#214f95" fill="#214f95" strokeWidth={0.7} listening={false} />
    <Text x={-30} y={depth / 2 + 24} width={48} text={`${depth.toFixed(2)} ft`} align="center" fontSize={5.5} fontStyle="bold" fill="#214f95" rotation={-90} listening={false} />
  </>
}
