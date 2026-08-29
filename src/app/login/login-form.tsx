'use client'

import { useActionState } from 'react'
import { login } from './actions'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <form action={formAction} className="flex flex-col gap-3">
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
        placeholder="Lozinka"
        className="rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />

      {state?.greska && <p className="text-sm text-red-600">{state.greska}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Prijavljivanje...' : 'Prijavi se'}
      </button>
    </form>
  )
}
