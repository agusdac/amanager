/** Pick SVG fill for Simple Icons on light vs dark surfaces. */
function relativeLuminance(hex: string): number {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return 0.5
  const channel = (i: number) => {
    const v = parseInt(raw.slice(i * 2, i * 2 + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const r = channel(0)
  const g = channel(1)
  const b = channel(2)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function brandIconFill(hex: string, dark: boolean): string {
  const normalized = hex.replace('#', '')
  const color = `#${normalized}`
  if (!dark) {
    if (relativeLuminance(normalized) > 0.88) return '#44403c'
    return color
  }
  if (relativeLuminance(normalized) < 0.42) return '#f5f5f4'
  if (relativeLuminance(normalized) > 0.88) return '#d6d3d1'
  return color
}