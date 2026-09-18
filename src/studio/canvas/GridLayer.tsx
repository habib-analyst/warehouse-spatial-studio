import { Line } from "react-konva"

export function GridLayer({ width, depth, visible }: { width: number; depth: number; visible: boolean }) {
  if (!visible) return null
  const minor = 1
  const major = 10
  const lines = []
  for (let x = 0; x <= width; x += minor) {
    lines.push(<Line key={`x-${x}`} points={[x, 0, x, depth]} stroke={x % major === 0 ? "#d7e4f3" : "#edf3fa"} strokeWidth={x % major === 0 ? 0.55 : 0.3} listening={false} />)
  }
  for (let y = 0; y <= depth; y += minor) {
    lines.push(<Line key={`y-${y}`} points={[0, y, width, y]} stroke={y % major === 0 ? "#d7e4f3" : "#edf3fa"} strokeWidth={y % major === 0 ? 0.55 : 0.3} listening={false} />)
  }
  return <>{lines}</>
}
