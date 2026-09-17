import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_6px_20px_rgba(93,79,207,0.35)] hover:brightness-105',
  secondary:
    'bg-white/70 text-[#3a3454] border border-white/80 shadow-sm hover:bg-white/90',
  danger: 'bg-white/70 text-rose-600 border border-rose-200 hover:bg-rose-50',
  ghost: 'bg-transparent text-[#5b5478] hover:bg-white/50',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ' +
        'transition disabled:cursor-not-allowed disabled:opacity-50 ' +
        variants[variant] +
        ' ' +
        className
      }
      {...props}
    />
  )
}
