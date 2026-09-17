import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'glass' | 'outline' | 'danger' | 'danger-outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5',
  md: 'h-10 px-4 text-[13px] gap-2',
  lg: 'h-12 px-6 text-[14px] gap-2',
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary shadow-[0_8px_22px_rgba(91,63,228,0.35)] hover:shadow-[0_12px_28px_rgba(91,63,228,0.45)] hover:-translate-y-0.5',
  secondary: 'bg-white text-on-surface border border-outline-variant hover:border-primary/40 hover:text-primary',
  glass: 'liquid-glass text-on-surface hover:text-primary',
  outline: 'bg-transparent text-primary border border-primary/40 hover:bg-primary/8',
  danger:
    'bg-error text-on-error shadow-[0_8px_22px_rgba(226,68,92,0.32)] hover:shadow-[0_12px_28px_rgba(226,68,92,0.42)] hover:-translate-y-0.5',
  'danger-outline': 'bg-transparent text-error border border-error/40 hover:bg-error/8',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-black/5 hover:text-on-surface',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap
        transition-all duration-200 select-none
        ${SIZES[size]}
        ${VARIANTS[variant]}
        ${disabled ? 'opacity-55 cursor-not-allowed !translate-y-0 !shadow-none' : 'cursor-pointer'}
        ${className}`}
      {...props}
    />
  )
}
