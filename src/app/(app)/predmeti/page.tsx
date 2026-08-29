import { GreskaBaner } from '@/components/greska-baner'
import { PraznoStanje } from '@/components/prazno-stanje'
import { SubmitDugme } from '@/components/submit-dugme'
import { createClient } from '@/lib/supabase/server'
import { dodajPredmet, ukloniPredmet } from './actions'

// Next.js 16: searchParams je Promise i mora se await-ovati.
export default async function PredmetiPage({
  searchParams,
}: {
  searchParams: Promise<{ akcija_greska?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: sviPredmeti }, { data: moji }] = await Promise.all([
    supabase.from('subjects').select('id, naziv, kategorija').order('kategorija').order('naziv'),
    supabase.from('user_subjects').select('subject_id, nivo').eq('user_id', user!.id),
  ])

  const mojiIds = new Set((moji ?? []).map((m) => m.subject_id))
  const nivoPo = new Map((moji ?? []).map((m) => [m.subject_id, m.nivo]))

  // Grupisanje po kategoriji radi preglednijeg prikaza
  const poKategoriji = new Map<string, typeof sviPredmeti>()
  for (const p of sviPredmeti ?? []) {
    const k = p.kategorija ?? 'Ostalo'
    if (!poKategoriji.has(k)) poKategoriji.set(k, [])
    poKategoriji.get(k)!.push(p)
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Moji predmeti</h1>
        <p className="text-sm text-gray-600">
          Izabrano: {mojiIds.size}. Na osnovu ovoga ti predlazemo korisnike i grupe.
        </p>
      </header>

      {sp.akcija_greska === '1' && <GreskaBaner poruka="Radnja nije uspela. Pokusaj ponovo." />}

      {poKategoriji.size === 0 && (
        <PraznoStanje naslov="Trenutno nema dostupnih predmeta u katalogu." />
      )}

      {[...poKategoriji.entries()].map(([kategorija, predmeti]) => (
        <section key={kategorija} className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            {kategorija}
          </h2>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {predmeti!.map((p) => {
              const izabran = mojiIds.has(p.id)
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 p-3 transition-colors hover:bg-gray-50">
                  <div className="min-w-0 break-words">
                    <p className="font-medium">{p.naziv}</p>
                    {izabran && (
                      <p className="text-xs text-gray-500">nivo: {nivoPo.get(p.id)}</p>
                    )}
                  </div>

                  {izabran ? (
                    <form action={ukloniPredmet}>
                      <input type="hidden" name="subject_id" value={p.id} />
                      <SubmitDugme ucitavanjeTekst="Uklanjanje...">Ukloni</SubmitDugme>
                    </form>
                  ) : (
                    <form action={dodajPredmet} className="flex items-center gap-2">
                      <input type="hidden" name="subject_id" value={p.id} />
                      <select name="nivo" defaultValue="srednji" className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                        <option value="pocetnik">pocetnik</option>
                        <option value="srednji">srednji</option>
                        <option value="napredni">napredni</option>
                      </select>
                      <SubmitDugme
                        ucitavanjeTekst="Dodavanje..."
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Dodaj
                      </SubmitDugme>
                    </form>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </main>
  )
}
