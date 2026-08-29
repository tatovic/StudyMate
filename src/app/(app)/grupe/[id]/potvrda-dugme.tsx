'use client'

import { useState, type ReactNode } from 'react'
import { SubmitDugme } from '@/components/submit-dugme'

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
        className={`shrink-0 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
          opasno ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {dugme}
      </button>
    )
  }

  return (
    <form
      action={action}
      className="flex flex-col items-end gap-2 rounded-xl border border-red-200 bg-red-50 p-3"
    >
      {children}
      <p className="text-right text-sm text-red-800">{poruka}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPotvrda(false)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Otkazi
        </button>
        <SubmitDugme
          ucitavanjeTekst="Slanje..."
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {potvrdaLabela}
        </SubmitDugme>
      </div>
    </form>
  )
}
