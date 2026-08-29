import Link from 'next/link'
import { Avatar } from '@/components/avatar'
import { PraznoStanje } from '@/components/prazno-stanje'
import { SubmitDugme } from '@/components/submit-dugme'
import { createClient } from '@/lib/supabase/server'
import { rangirajSlicneKorisnike, type SlicanKorisnik } from '@/lib/rangiranje'

const NIVOI = ['pocetnik', 'srednji', 'napredni'] as const

type SearchParams = { q?: string; predmet?: string; nivo?: string }

function url(params: SearchParams) {
  const usp = new URLSearchParams()
  if (params.q) usp.set('q', params.q)
  if (params.predmet) usp.set('predmet', params.predmet)
  if (params.nivo) usp.set('nivo', params.nivo)
  const qs = usp.toString()
  return qs ? `/korisnici?${qs}` : '/korisnici'
}

// Next.js 16: searchParams je Promise i mora se await-ovati.
export default async function KorisniciPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const pretraga = sp.q?.trim() || undefined
  const predmetId = sp.predmet ? Number(sp.predmet) : undefined
  // Nivo ima smisla samo uz izabran predmet.
  const nivo = predmetId && sp.nivo ? sp.nivo : undefined

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: mojiPredmeti } = await supabase
    .from('user_subjects')
    .select('subject_id')
    .eq('user_id', user!.id)

  if (!mojiPredmeti?.length) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Pretraga korisnika</h1>
        <PraznoStanje
          naslov="Jos nisi izabrao nijedan predmet, pa ne mozemo prikazati koliko predmeta delis sa drugima."
          akcija={{ href: '/predmeti', label: 'Izaberi svoje predmete' }}
        />
      </main>
    )
  }

  const [{ data: sviPredmeti }, { data: rezultatiSirovi }] = await Promise.all([
    supabase.from('subjects').select('id, naziv').order('naziv'),
    supabase.rpc('pretrazi_korisnike', {
      pretraga: pretraga ?? null,
      p_subject_id: predmetId ?? null,
      p_nivo: nivo ?? null,
    }),
  ])

  const rezultati: SlicanKorisnik[] | null = rezultatiSirovi
    ? rangirajSlicneKorisnike(rezultatiSirovi, rezultatiSirovi.length)
    : null

  const nazivPredmeta = sviPredmeti?.find((p) => p.id === predmetId)?.naziv ?? sp.predmet

  const aktivniFilteri = [
    pretraga && {
      label: `pretraga: "${pretraga}"`,
      href: url({ predmet: sp.predmet, nivo: sp.nivo }),
    },
    predmetId && {
      label: `predmet: ${nazivPredmeta}`,
      href: url({ q: pretraga }),
    },
    nivo && {
      label: `nivo: ${nivo}`,
      href: url({ q: pretraga, predmet: sp.predmet }),
    },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pretraga korisnika</h1>
        <p className="text-sm text-gray-600">Pronadji ljude po imenu, predmetu i nivou znanja.</p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs text-gray-600">
            Ime
          </label>
          <input
            id="q"
            type="text"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Pretrazi po imenu"
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
            {(sviPredmeti ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.naziv}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="nivo" className="text-xs text-gray-600">
            Nivo znanja
          </label>
          <select
            id="nivo"
            name="nivo"
            defaultValue={sp.nivo ?? ''}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Svi nivoi</option>
            {NIVOI.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

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
          <Link href="/korisnici" className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline">
            Ocisti sve
          </Link>
        </div>
      )}

      {!rezultati?.length ? (
        aktivniFilteri.length > 0 ? (
          <PraznoStanje
            naslov="Nema korisnika koji odgovaraju pretrazi i izabranim filterima."
            akcija={{ href: '/korisnici', label: 'Ocisti filtere' }}
          />
        ) : (
          <PraznoStanje naslov="Trenutno nema drugih korisnika za prikaz." />
        )
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {rezultati.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-4 p-3 transition-colors hover:bg-gray-50">
              <Link href={`/profil/${k.id}`} className="flex min-w-0 items-center gap-3">
                <Avatar url={k.avatar_url} ime={k.ime} />
                <div className="min-w-0">
                  <p className="truncate font-medium hover:underline">{k.ime}</p>
                  {k.predmeti.length > 0 && (
                    <p className="truncate text-sm text-gray-600">{k.predmeti.join(', ')}</p>
                  )}
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
    </main>
  )
}
