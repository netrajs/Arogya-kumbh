import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const fieldBase =
  'w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm text-[#241f3a] ' +
  'placeholder:text-[#9a93b3] shadow-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-200'

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7a7396]">{children}</label>
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
