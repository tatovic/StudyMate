'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Prijava na StudyMate</h1>

      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Lozinka"
          className="rounded-md border px-3 py-2"
        />

        {state?.greska && <p className="text-sm text-red-600">{state.greska}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Prijavljivanje...' : 'Prijavi se'}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        Nemas nalog?{' '}
        <Link href="/register" className="underline">
          Registruj se
        </Link>
      </p>
    </main>
  )
}
