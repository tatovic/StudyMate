'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

// Deljeno dugme za slanje forme - onemogucava dvostruko slanje i prikazuje
// stanje slanja, cita ga iz najblize roditeljske <form> preko useFormStatus
// (radi i kad forma zivi u Server Component-i, jer se cita iz DOM stabla, ne
// iz React konteksta) - tiket 10.
export function SubmitDugme({
  children,
  ucitavanjeTekst,
  className = 'rounded-md border px-3 py-1.5 text-sm disabled:opacity-50',
}: {
  children: ReactNode
  ucitavanjeTekst: string
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? ucitavanjeTekst : children}
    </button>
  )
}
