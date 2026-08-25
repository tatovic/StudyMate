import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Slican = {
  id: string
  ime: string
  skola: string | null
  zajednicki: number
  predmeti: string[]
}

type Preporuka = {
  id: number
  naziv: string
  predmet: string
  broj_clanova: number
  max_clanova: number
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profil } = await supabase
    .from('profiles')
    .select('ime, skola')
    .eq('id', user!.id)
    .single()

  const [{ data: slicni }, { data: grupe }] = await Promise.all([
    supabase.rpc('pronadji_slicne', { limit_n: 10 }),
    supabase.rpc('preporuci_grupe', { limit_n: 10 }),
  ])

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Zdravo, {profil?.ime ?? 'korisnice'}</h1>
        {profil?.skola && <p className="text-sm text-gray-600">{profil.skola}</p>}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Slicni korisnici</h2>
        {!slicni?.length ? (
          <p className="text-sm text-gray-600">
            Jos nema predloga.{' '}
            <Link href="/predmeti" className="underline">
              Izaberi svoje predmete
            </Link>{' '}
            da bismo pronasli koga da ti predlozimo.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {(slicni as Slican[]).map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-4 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{k.ime}</p>
                  <p className="truncate text-sm text-gray-600">{k.predmeti.join(', ')}</p>
                  {k.skola && <p className="text-xs text-gray-500">{k.skola}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                  {k.zajednicki} zajednickih
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Preporucene grupe</h2>
          <Link href="/grupe" className="text-sm underline">
            Sve grupe
          </Link>
        </div>
        {!grupe?.length ? (
          <p className="text-sm text-gray-600">Trenutno nema otvorenih grupa za tvoje predmete.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {(grupe as Preporuka[]).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 p-3">
                <div className="min-w-0">
                  <Link href={`/grupe/${g.id}`} className="font-medium hover:underline">
                    {g.naziv}
                  </Link>
                  <p className="text-sm text-gray-600">{g.predmet}</p>
                </div>
                <span className="shrink-0 text-xs text-gray-600">
                  {g.broj_clanova}/{g.max_clanova}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
