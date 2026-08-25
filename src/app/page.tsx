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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-6">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold">StudyMate</h1>
        <p className="text-lg text-gray-600">
          Pronadji ucenike i studente koji uce iste predmete kao ti, i ucite zajedno.
        </p>
      </div>

      <ul className="space-y-2 text-gray-700">
        <li>· Izaberi predmete koje ucis</li>
        <li>· Vidi korisnike sa najvise zajednickih predmeta</li>
        <li>· Pridruzi se grupi za ucenje ili napravi svoju</li>
        <li>· Dogovarajte se u chatu grupe</li>
      </ul>

      <div className="flex gap-3">
        <Link href="/register" className="rounded-md bg-black px-5 py-2.5 text-white">
          Registruj se
        </Link>
        <Link href="/login" className="rounded-md border px-5 py-2.5">
          Prijavi se
        </Link>
      </div>
    </main>
  )
}
