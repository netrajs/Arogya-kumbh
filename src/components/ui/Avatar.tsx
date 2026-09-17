function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      title={name}
    >
      {initials(name)}
    </div>
  )
}
