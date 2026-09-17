import type { CSSProperties } from 'react'

export function MIcon({
  name,
  className = '',
  filled = false,
  style,
}: {
  name: string
  className?: string
  filled?: boolean
  style?: CSSProperties
}) {
  return (
    <span
      className={`material-symbols-rounded select-none ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1", ...style } : style}
    >
      {name}
    </span>
  )
}
