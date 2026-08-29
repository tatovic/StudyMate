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
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        Napravi grupu
      </button>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <input
        name="naziv"
        required
        placeholder="Naziv grupe"
        className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />

      <select
        name="subject_id"
        required
        defaultValue=""
        className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      >
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
        className="rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />

      <label className="flex items-center gap-2 text-sm">
        Maks. clanova
        <input
          name="max_clanova"
          type="number"
          min={2}
          max={100}
          defaultValue={10}
          className="w-20 rounded-lg border border-gray-300 px-2 py-1 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input name="is_public" type="checkbox" defaultChecked className="accent-indigo-600" />
        Javna grupa (vidljiva svima)
      </label>

      {state?.greska && <p className="text-sm text-red-600">{state.greska}</p>}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Kreiranje...' : 'Kreiraj'}
        </button>
        <button
          type="button"
          onClick={() => setOtvoren(false)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Otkazi
        </button>
      </div>
    </form>
  )
}
