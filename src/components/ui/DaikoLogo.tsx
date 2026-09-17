import { useMemo } from 'react'

export const DAIKO_INK = '#2A0059'
export const DAIKO_VIOLET = '#7C6CFB'

/**
 * The Daiko mark: a split ring — deep indigo on the left, violet on the right,
 * meeting at two chevron notches — with a pill-shaped cutout through the middle
 * and a small tab above. Ported from the platform's leave-management app
 * (feat/daiko-redesign) so Clinic uses the exact same mark.
 *
 * Built as geometry rather than a bitmap so it stays sharp at any size and
 * recolours if the brand ever shifts. The cutout is a real hole (a mask, not a
 * white fill), so the mark sits correctly on glass, on white and on the indigo
 * sidebar tile alike.
 */
export function DaikoLogo({
  className = '',
  title = 'Daiko',
  ink = DAIKO_INK,
  violet = DAIKO_VIOLET,
}: {
  className?: string
  title?: string
  ink?: string
  violet?: string
}) {
  const maskId = useMemo(() => `daiko-ring-${Math.random().toString(36).slice(2, 9)}`, [])

  return (
    <svg viewBox="0 0 430 430" className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id={maskId}>
          <rect x="75" y="120" width="280" height="235" rx="100" fill="#fff" />
          <rect x="126" y="180" width="180" height="116" rx="58" fill="#000" />
        </mask>
      </defs>

      <rect x="175" y="74" width="88" height="32" rx="11" fill={ink} />

      <g mask={`url(#${maskId})`}>
        <rect x="75" y="120" width="280" height="235" fill={violet} />
        <path d="M75 120 H215 L258 150 L215 178 V298 L258 326 L215 355 H75 Z" fill={ink} />
      </g>
    </svg>
  )
}

/** Mark plus wordmark, for the login screen and any future header. */
export function DaikoLockup({ className = '', markClassName = 'w-12 h-12' }: { className?: string; markClassName?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <DaikoLogo className={markClassName} />
      <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Daiko</span>
    </div>
  )
}
