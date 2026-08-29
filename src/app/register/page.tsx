'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { register } from '../login/actions'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, null)

  return (
    <main className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-indigo-50 via-white to-white p-6">
      <div className="mx-auto w-full max-w-sm space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Napravi nalog</h1>

        <form action={formAction} className="flex flex-col gap-3">
          <input
            name="ime"
            required
            placeholder="Ime i prezime"
            className="rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Lozinka (min. 6 karaktera)"
            className="rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />

          {state?.greska && <p className="text-sm text-red-600">{state.greska}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Kreiranje...' : 'Registruj se'}
          </button>
        </form>

        <p className="text-sm text-gray-600">
          Imas nalog?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Prijavi se
          </Link>
        </p>
      </div>
    </main>
  )
}
