import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldBase =
  'w-full rounded-control border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface ' +
  'placeholder:text-on-surface-variant/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20'

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block font-label-caps text-label-caps uppercase text-on-surface-variant">
      {children}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={fieldBase} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={fieldBase + ' resize-none'} rows={3} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={fieldBase} {...props} />
}
