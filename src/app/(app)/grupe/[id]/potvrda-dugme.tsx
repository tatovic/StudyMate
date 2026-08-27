'use client'

import { useState, type ReactNode } from 'react'

// Deljeno dugme za destruktivne radnje (napusti grupu, ukloni clana, obrisi grupu) -
// prvi klik samo otkriva potvrdu sa opisom posledica, drugi klik zaista salje formu.
export function PotvrdaDugme({
  action,
  children,
  dugme,
  poruka,
  potvrdaLabela = 'Da, potvrdi',
  opasno = false,
}: {
  action: (formData: FormData) => void | Promise<void>
  children?: ReactNode
  dugme: string
  poruka: string
  potvrdaLabela?: string
  opasno?: boolean
}) {
  const [potvrda, setPotvrda] = useState(false)

  if (!potvrda) {
    return (
      <button
        type="button"
        onClick={() => setPotvrda(true)}
        className={`shrink-0 rounded-md border px-3 py-1.5 text-sm ${
          opasno ? 'border-red-300 text-red-700' : ''
        }`}
      >
        {dugme}
      </button>
    )
  }

  return (
    <form
      action={action}
      className="flex flex-col items-end gap-2 rounded-md border border-red-200 bg-red-50 p-3"
    >
      {children}
      <p className="text-right text-sm text-red-800">{poruka}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPotvrda(false)}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          Otkazi
        </button>
        <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white">
          {potvrdaLabela}
        </button>
      </div>
    </form>
  )
}
