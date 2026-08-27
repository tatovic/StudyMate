'use client'

import { useActionState, useState } from 'react'
import { izmeniGrupu } from '../actions'

type Predmet = { id: number; naziv: string }

type Grupa = {
  id: number
  naziv: string
  opis: string | null
  subject_id: number | null
  max_clanova: number
  is_public: boolean
}

export function IzmeniGrupu({ grupa, predmeti }: { grupa: Grupa; predmeti: Predmet[] }) {
  const [otvoren, setOtvoren] = useState(false)
  const [state, formAction, pending] = useActionState(izmeniGrupu, null)

  if (!otvoren) {
    return (
      <button
        type="button"
        onClick={() => setOtvoren(true)}
        className="shrink-0 rounded-md border px-3 py-1.5 text-sm"
      >
        Izmeni grupu
      </button>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md border p-4">
      <input type="hidden" name="group_id" value={grupa.id} />

      <input
        name="naziv"
        required
        defaultValue={grupa.naziv}
        placeholder="Naziv grupe"
        className="rounded-md border px-3 py-2"
      />

      <select
        name="subject_id"
        required
        defaultValue={grupa.subject_id ?? ''}
        className="rounded-md border px-3 py-2"
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
        defaultValue={grupa.opis ?? ''}
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
          defaultValue={grupa.max_clanova}
          className="w-20 rounded-md border px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input name="is_public" type="checkbox" defaultChecked={grupa.is_public} />
        Javna grupa (vidljiva svima)
      </label>

      {state?.greska && <p className="text-sm text-red-600">{state.greska}</p>}
      {state?.poruka && <p className="text-sm text-green-700">{state.poruka}</p>}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? 'Cuvanje...' : 'Sacuvaj izmene'}
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
