import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NovaGrupa } from './nova-grupa'
import { pridruziSe } from './actions'

export default async function GrupePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: predmeti }, { data: mojaClanstva }, { data: grupe }] = await Promise.all([
    supabase.from('subjects').select('id, naziv').order('naziv'),
    supabase.from('group_members').select('group_id').eq('user_id', user!.id),
    supabase
      .from('groups')
      .select('id, naziv, opis, max_clanova, is_public, subjects(naziv), group_members(count)')
      .order('created_at', { ascending: false })
      // subjects je many-to-one relacija pa je objekat, a ne niz kao sto Supabase pretpostavlja
      // dok nema generisanih tipova baze.
      .overrideTypes<
        {
          subjects: { naziv: string } | null
          group_members: { count: number }[]
        }[]
      >(),
  ])

  const mojeGrupe = new Set((mojaClanstva ?? []).map((c) => c.group_id))

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Grupe za ucenje</h1>
          <p className="text-sm text-gray-600">
            Vidis javne grupe i one cijim si clan.
          </p>
        </div>
      </header>

      <NovaGrupa predmeti={predmeti ?? []} />

      {!grupe?.length ? (
        <p className="text-sm text-gray-600">Jos nema grupa. Napravi prvu.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {grupe.map((g) => {
            const broj = g.group_members?.[0]?.count ?? 0
            const clan = mojeGrupe.has(g.id)
            const puna = broj >= g.max_clanova

            return (
              <li key={g.id} className="flex items-start justify-between gap-4 p-3">
                <div className="min-w-0">
                  <Link href={`/grupe/${g.id}`} className="font-medium hover:underline">
                    {g.naziv}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {g.subjects?.naziv ?? 'bez predmeta'} · {broj}/{g.max_clanova} clanova
                    {!g.is_public && ' · privatna'}
                  </p>
                  {g.opis && <p className="mt-1 text-sm text-gray-500">{g.opis}</p>}
                </div>

                {clan ? (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs">clan</span>
                ) : puna ? (
                  <span className="shrink-0 text-xs text-gray-500">popunjena</span>
                ) : (
                  <form action={pridruziSe} className="shrink-0">
                    <input type="hidden" name="group_id" value={g.id} />
                    <button className="rounded-md border px-3 py-1.5 text-sm">Pridruzi se</button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
