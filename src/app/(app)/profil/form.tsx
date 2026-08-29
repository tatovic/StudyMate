'use client'

import { useActionState } from 'react'
import { sacuvajProfil } from './actions'

type Profil = { ime: string; skola: string | null; opis: string | null }

export function ProfilForm({ profil }: { profil: Profil }) {
  const [state, formAction, pending] = useActionState(sacuvajProfil, null)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Ime i prezime
        <input
          name="ime"
          required
          defaultValue={profil.ime}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Skola / fakultet
        <input
          name="skola"
          defaultValue={profil.skola ?? ''}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        O meni
        <textarea
          name="opis"
          rows={4}
          defaultValue={profil.opis ?? ''}
          placeholder="Kako ucis, kada si dostupan, sta trazis od partnera za ucenje..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </label>

      {state?.greska && <p className="text-sm text-red-600">{state.greska}</p>}
      {state?.poruka && <p className="text-sm text-green-700">{state.poruka}</p>}

      <button
        disabled={pending}
        className="self-start rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Cuvanje...' : 'Sacuvaj'}
      </button>
    </form>
  )
}
