import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary border border-primary hover:brightness-105',
  secondary:
    'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container-low',
  outline: 'bg-transparent text-primary border border-primary hover:bg-primary/5',
  danger: 'bg-error text-on-error border border-error hover:brightness-105',
  ghost: 'bg-transparent text-on-surface-variant border border-transparent hover:bg-surface-container-high',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-[18px] py-[9px] text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={
        'inline-flex items-center justify-center gap-2 rounded-control font-semibold ' +
        'transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 ' +
        variants[variant] +
        ' ' +
        sizes[size] +
        ' ' +
        className
      }
      {...props}
    />
  )
}
