import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-tight text-gray-900">
            Study<span className="text-indigo-600">Mate</span>
          </h1>
          <p className="text-lg text-gray-600">
            Pronadji ucenike i studente koji uce iste predmete kao ti, i ucite zajedno.
          </p>
        </div>

        <ul className="space-y-2.5 rounded-xl border border-gray-200 bg-white/70 p-5 text-gray-700 shadow-sm">
          <li className="flex gap-2">
            <span className="text-indigo-500">›</span> Izaberi predmete koje ucis
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500">›</span> Vidi korisnike sa najvise zajednickih predmeta
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500">›</span> Pridruzi se grupi za ucenje ili napravi svoju
          </li>
          <li className="flex gap-2">
            <span className="text-indigo-500">›</span> Dogovarajte se u chatu grupe
          </li>
        </ul>

        <div className="flex gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Registruj se
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Prijavi se
          </Link>
        </div>
      </div>
    </main>
  )
}
