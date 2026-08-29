import Link from 'next/link'
import { Avatar } from '@/components/avatar'
import { PraznoStanje } from '@/components/prazno-stanje'
import { createClient } from '@/lib/supabase/server'
import {
  rangirajSlicneKorisnike,
  rangirajPreporuceneGrupe,
  type SlicanKorisnik,
  type PreporucenaGrupa,
} from '@/lib/rangiranje'

type Slican = SlicanKorisnik
type Preporuka = PreporucenaGrupa

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

  const [{ data: slicniSirovi }, { data: grupeSirove }, { count: brojPredmeta }] = await Promise.all([
    supabase.rpc('pronadji_slicne', { limit_n: 10 }),
    supabase.rpc('preporuci_grupe', { limit_n: 10 }),
    supabase
      .from('user_subjects')
      .select('subject_id', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  // RPC vec vraca sortirano i ograniceno, ali redosled prikaza je poslovno pravilo
  // (vidi tests/unit/rangiranje.test.ts), pa se eksplicitno primenjuje i ovde.
  const slicni: Slican[] | null = slicniSirovi
    ? rangirajSlicneKorisnike(slicniSirovi, 10)
    : null
  const grupe: Preporuka[] | null = grupeSirove
    ? rangirajPreporuceneGrupe(grupeSirove, 10)
    : null

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Zdravo, {profil?.ime ?? 'korisnice'}</h1>
        {profil?.skola && <p className="text-sm text-gray-600">{profil.skola}</p>}
      </header>

      {!brojPredmeta && (
        <PraznoStanje
          naslov="Dobrodosao/la na StudyMate! Izaberi predmete koje ucis da bismo ti predlozili ljude i grupe za ucenje."
          akcija={{ href: '/predmeti', label: 'Izaberi predmete' }}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium tracking-tight">Slicni korisnici</h2>
        {!slicni?.length ? (
          <PraznoStanje
            naslov="Jos nema predloga. Izaberi svoje predmete da bismo pronasli koga da ti predlozimo."
            akcija={{ href: '/predmeti', label: 'Izaberi predmete' }}
          />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {slicni!.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-4 p-3 transition-colors hover:bg-gray-50">
                <Link href={`/profil/${k.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar url={k.avatar_url} ime={k.ime} />
                  <div className="min-w-0">
                    <p className="truncate font-medium hover:underline">{k.ime}</p>
                    <p className="truncate text-sm text-gray-600">{k.predmeti.join(', ')}</p>
                    {k.skola && <p className="text-xs text-gray-500">{k.skola}</p>}
                  </div>
                </Link>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {k.zajednicki} zajednickih
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">Preporucene grupe</h2>
          <Link href="/grupe" className="text-sm font-medium text-indigo-600 hover:underline">
            Sve grupe
          </Link>
        </div>
        {!grupe?.length ? (
          <PraznoStanje
            naslov="Trenutno nema otvorenih grupa za tvoje predmete."
            akcija={{ href: '/grupe', label: 'Napravi grupu' }}
          />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {grupe!.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-4 p-3 transition-colors hover:bg-gray-50">
                <div className="min-w-0">
                  <Link href={`/grupe/${g.id}`} className="block truncate font-medium hover:underline">
                    {g.naziv}
                  </Link>
                  <p className="truncate text-sm text-gray-600">{g.predmet}</p>
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
