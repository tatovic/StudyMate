import Link from 'next/link'
import { GreskaBaner } from '@/components/greska-baner'
import { PraznoStanje } from '@/components/prazno-stanje'
import { SubmitDugme } from '@/components/submit-dugme'
import { createClient } from '@/lib/supabase/server'
import { NovaGrupa } from './nova-grupa'
import { pridruziSe } from './actions'

type SearchParams = {
  q?: string
  predmet?: string
  moji?: string
  slobodne?: string
  obrisana?: string
  akcija_greska?: string
}

function url(params: SearchParams) {
  const usp = new URLSearchParams()
  if (params.q) usp.set('q', params.q)
  if (params.predmet) usp.set('predmet', params.predmet)
  if (params.moji) usp.set('moji', params.moji)
  if (params.slobodne) usp.set('slobodne', params.slobodne)
  const qs = usp.toString()
  return qs ? `/grupe?${qs}` : '/grupe'
}

// Next.js 16: searchParams je Promise i mora se await-ovati.
export default async function GrupePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const pretraga = sp.q?.trim() || undefined
  const predmetId = sp.predmet ? Number(sp.predmet) : undefined
  const samoMoji = sp.moji === '1'
  const samoSlobodne = sp.slobodne === '1'
  const filteriAktivni = Boolean(pretraga || predmetId || samoMoji || samoSlobodne)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: predmeti }, { data: mojiPredmetiRedovi }, { data: mojaClanstva }] = await Promise.all([
    supabase.from('subjects').select('id, naziv').order('naziv'),
    supabase.from('user_subjects').select('subject_id').eq('user_id', user!.id),
    supabase.from('group_members').select('group_id, status').eq('user_id', user!.id),
  ])

  const mojiPredmetiIds = new Set((mojiPredmetiRedovi ?? []).map((r) => r.subject_id))
  // Privatna grupa je sada vidljiva u pretrazi svima (tiket 08), pa "clan" mora
  // da znaci aktivno clanstvo - zahtev na cekanju se prikazuje posebno, ne kao
  // "clan" i ne racuna se u popunjenost.
  const mojeGrupe = new Set(
    (mojaClanstva ?? []).filter((c) => c.status === 'aktivan').map((c) => c.group_id)
  )
  const mojiZahtevi = new Set(
    (mojaClanstva ?? []).filter((c) => c.status === 'na_cekanju').map((c) => c.group_id)
  )

  let upit = supabase
    .from('groups')
    .select('id, naziv, opis, max_clanova, is_public, subject_id, subjects(naziv), group_members(count)')
    .order('created_at', { ascending: false })

  if (pretraga) upit = upit.ilike('naziv', `%${pretraga}%`)
  if (predmetId) upit = upit.eq('subject_id', predmetId)
  if (samoMoji) upit = upit.in('subject_id', [...mojiPredmetiIds])

  // "Samo moji predmeti" bez ijednog izabranog predmeta znaci namerno nema rezultata,
  // ne "sve grupe" - .in() sa praznim nizom bi bio pogresan upit, zato ga preskacemo.
  const preskociUpit = samoMoji && mojiPredmetiIds.size === 0
  const { data: grupeSirove } = preskociUpit ? { data: null } : await upit

  const grupe = (grupeSirove ?? [])
    .map((g) => ({ ...g, broj: g.group_members?.[0]?.count ?? 0 }))
    .filter((g) => !samoSlobodne || g.broj < g.max_clanova)

  const nazivPredmeta = predmeti?.find((p) => p.id === predmetId)?.naziv ?? sp.predmet

  const aktivniFilteri = [
    pretraga && {
      label: `pretraga: "${pretraga}"`,
      href: url({ predmet: sp.predmet, moji: sp.moji, slobodne: sp.slobodne }),
    },
    predmetId && {
      label: `predmet: ${nazivPredmeta}`,
      href: url({ q: pretraga, moji: sp.moji, slobodne: sp.slobodne }),
    },
    samoMoji && {
      label: 'samo moji predmeti',
      href: url({ q: pretraga, predmet: sp.predmet, slobodne: sp.slobodne }),
    },
    samoSlobodne && {
      label: 'samo slobodne',
      href: url({ q: pretraga, predmet: sp.predmet, moji: sp.moji }),
    },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grupe za ucenje</h1>
          <p className="text-sm text-gray-600">
            Vidis sve grupe. Privatnoj se pridruzujes uz odobrenje vlasnika.
          </p>
        </div>
      </header>

      {sp.obrisana === '1' && (
        <p className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
          Grupa je uspesno obrisana.
        </p>
      )}

      {sp.akcija_greska === '1' && <GreskaBaner poruka="Radnja nije uspela. Pokusaj ponovo." />}

      <NovaGrupa predmeti={predmeti ?? []} />

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs text-gray-600">
            Naziv
          </label>
          <input
            id="q"
            type="text"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Pretrazi po nazivu"
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="predmet" className="text-xs text-gray-600">
            Predmet
          </label>
          <select
            id="predmet"
            name="predmet"
            defaultValue={sp.predmet ?? ''}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Svi predmeti</option>
            {(predmeti ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.naziv}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-1.5 pb-1.5 text-sm">
          <input type="checkbox" name="moji" value="1" defaultChecked={samoMoji} className="accent-indigo-600" />
          Samo moji predmeti
        </label>

        <label className="flex items-center gap-1.5 pb-1.5 text-sm">
          <input type="checkbox" name="slobodne" value="1" defaultChecked={samoSlobodne} className="accent-indigo-600" />
          Samo slobodne (nepopunjene)
        </label>

        <SubmitDugme
          ucitavanjeTekst="Pretraga..."
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pretrazi
        </SubmitDugme>
      </form>

      {aktivniFilteri.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {aktivniFilteri.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 transition-colors hover:bg-indigo-100"
            >
              {f.label}
              <span aria-hidden>&times;</span>
            </Link>
          ))}
          <Link href="/grupe" className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline">
            Ocisti sve
          </Link>
        </div>
      )}

      {!grupe.length ? (
        filteriAktivni ? (
          <PraznoStanje
            naslov="Nema grupa koje odgovaraju pretrazi i izabranim filterima."
            akcija={{ href: '/grupe', label: 'Ocisti filtere' }}
          />
        ) : (
          <PraznoStanje naslov="Jos nema grupa. Napravi prvu grupu za ucenje pomocu dugmeta iznad." />
        )
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {grupe.map((g) => {
            const clan = mojeGrupe.has(g.id)
            const zahtevPoslat = mojiZahtevi.has(g.id)
            const puna = g.broj >= g.max_clanova
            const istaknuta = g.subject_id !== null && mojiPredmetiIds.has(g.subject_id)

            return (
              <li
                key={g.id}
                className={`flex items-start justify-between gap-4 p-3 transition-colors hover:bg-gray-50 ${
                  istaknuta ? 'bg-amber-50 hover:bg-amber-50' : ''
                }`}
              >
                <div className="min-w-0 break-words">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/grupe/${g.id}`} className="font-medium hover:underline">
                      {g.naziv}
                    </Link>
                    {istaknuta && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        tvoj predmet
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {g.subjects?.naziv ?? 'bez predmeta'} · {g.broj}/{g.max_clanova} clanova
                    {!g.is_public && ' · privatna'}
                  </p>
                  {g.opis && <p className="mt-1 text-sm text-gray-500">{g.opis}</p>}
                </div>

                {clan ? (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">clan</span>
                ) : zahtevPoslat ? (
                  <span className="shrink-0 text-xs text-gray-500">zahtev poslat</span>
                ) : !g.is_public ? (
                  <form action={pridruziSe} className="shrink-0">
                    <input type="hidden" name="group_id" value={g.id} />
                    <SubmitDugme ucitavanjeTekst="Slanje...">Zatrazi pristup</SubmitDugme>
                  </form>
                ) : puna ? (
                  <span className="shrink-0 text-xs text-gray-500">popunjena</span>
                ) : (
                  <form action={pridruziSe} className="shrink-0">
                    <input type="hidden" name="group_id" value={g.id} />
                    <SubmitDugme ucitavanjeTekst="Pridruzivanje...">Pridruzi se</SubmitDugme>
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
