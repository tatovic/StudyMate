'use client'

import { useActionState, useState } from 'react'
import { napraviGrupu } from './actions'

type Predmet = { id: number; naziv: string }

export function NovaGrupa({ predmeti }: { predmeti: Predmet[] }) {
  const [otvoren, setOtvoren] = useState(false)
  const [state, formAction, pending] = useActionState(napraviGrupu, null)

  if (!otvoren) {
    return (
      <button
        onClick={() => setOtvoren(true)}
        className="rounded-md bg-black px-4 py-2 text-sm text-white"
      >
        Napravi grupu
      </button>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border p-4">
      <input name="naziv" required placeholder="Naziv grupe" className="rounded-md border px-3 py-2" />

      <select name="subject_id" required defaultValue="" className="rounded-md border px-3 py-2">
        <option value="" disabled>
          Izaberi predmet
        </option>
        {predmeti.map((p) => (
          <option key={p.id} value={p.id}>
            {p.naziv}
          </option>
        ))}
      </select>

      <textarea
        name="opis"
        rows={3}
        placeholder="Opis grupe - sta ucite, kada se nalazite..."
        className="rounded-md border px-3 py-2"
      />

      <label className="flex items-center gap-2 text-sm">
        Maks. clanova
        <input
          name="max_clanova"
          type="number"
          min={2}
          max={100}
          defaultValue={10}
          className="w-20 rounded-md border px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input name="is_public" type="checkbox" defaultChecked />
        Javna grupa (vidljiva svima)
      </label>

      {state?.greska && <p className="text-sm text-red-600">{state.greska}</p>}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? 'Kreiranje...' : 'Kreiraj'}
        </button>
        <button
          type="button"
          onClick={() => setOtvoren(false)}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Otkazi
        </button>
      </div>
    </form>
  )
}
