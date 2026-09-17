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
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9d86ff] to-[#5b3fe4] text-white font-semibold shadow-[0_6px_18px_rgba(91,63,228,0.35)] ring-2 ring-white/70"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      title={name}
    >
      {initials(name)}
    </div>
  )
}
