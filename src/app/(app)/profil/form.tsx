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
          className="rounded-md border px-3 py-2 text-base"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Skola / fakultet
        <input
          name="skola"
          defaultValue={profil.skola ?? ''}
          className="rounded-md border px-3 py-2 text-base"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        O meni
        <textarea
          name="opis"
          rows={4}
          defaultValue={profil.opis ?? ''}
          placeholder="Kako ucis, kada si dostupan, sta trazis od partnera za ucenje..."
          className="rounded-md border px-3 py-2 text-base"
        />
      </label>

      {state?.greska && <p className="text-sm text-red-600">{state.greska}</p>}
      {state?.poruka && <p className="text-sm text-green-700">{state.poruka}</p>}

      <button
        disabled={pending}
        className="self-start rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? 'Cuvanje...' : 'Sacuvaj'}
      </button>
    </form>
  )
}
