import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/avatar'
import { PraznoStanje } from '@/components/prazno-stanje'
import { createClient } from '@/lib/supabase/server'

const NAZIVI_NIVOA: Record<string, string> = {
  pocetnik: 'pocetnik',
  srednji: 'srednji',
  napredni: 'napredni',
}

// Next.js 16: params je Promise i mora se await-ovati.
export default async function JavniProfilPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sopstveniProfil = id === user!.id

  const { data: profil } = await supabase
    .from('profiles')
    .select('id, ime, skola, opis, avatar_url')
    .eq('id', id)
    .maybeSingle()

  // RLS vraca prazno ako korisnik ne postoji - tretira se kao "nije pronadjeno".
  if (!profil) notFound()

  const [{ data: predmetiSirovi }, { data: mojiPredmeti }, { data: clanstvaSirova }] =
    await Promise.all([
      supabase.from('user_subjects').select('nivo, subjects(id, naziv)').eq('user_id', id),
      sopstveniProfil
        ? Promise.resolve({ data: null as { subject_id: number }[] | null })
        : supabase.from('user_subjects').select('subject_id').eq('user_id', user!.id),
      supabase
        .from('group_members')
        .select('groups!inner(id, naziv, is_public, subjects(naziv))')
        .eq('user_id', id)
        .eq('status', 'aktivan')
        .eq('groups.is_public', true),
    ])

  const mojiPredmetiIds = new Set((mojiPredmeti ?? []).map((p) => p.subject_id))
  const predmeti = (predmetiSirovi ?? []).filter((p) => p.subjects)

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <Link href="/dashboard" className="text-sm text-gray-600 hover:underline">
        &larr; Nazad
      </Link>

      <header className="flex flex-wrap items-start gap-4">
        <Avatar url={profil.avatar_url} ime={profil.ime} size={72} />
        <div className="min-w-0 flex-1 break-words">
          <h1 className="text-2xl font-semibold">{profil.ime}</h1>
          {profil.skola && <p className="text-sm text-gray-600">{profil.skola}</p>}
          {sopstveniProfil && (
            <Link
              href="/profil"
              className="mt-2 inline-block rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Izmeni profil
            </Link>
          )}
        </div>
      </header>

      {profil.opis && <p className="text-sm text-gray-700">{profil.opis}</p>}

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Predmeti</h2>
        {predmeti.length === 0 ? (
          <PraznoStanje naslov="Korisnik jos nije izabrao predmete." />
        ) : (
          <ul className="divide-y rounded-md border">
            {predmeti.map((p) => {
              const zajednicki = !sopstveniProfil && mojiPredmetiIds.has(p.subjects!.id)
              return (
                <li
                  key={p.subjects!.id}
                  className={`flex items-center justify-between gap-4 p-3 ${
                    zajednicki ? 'bg-gray-50' : ''
                  }`}
                >
                  <span className="font-medium">{p.subjects!.naziv}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {zajednicki && (
                      <span className="rounded-full bg-black px-2.5 py-1 text-xs text-white">
                        zajednicki
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {NAZIVI_NIVOA[p.nivo] ?? p.nivo}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Javne grupe</h2>
        {!clanstvaSirova?.length ? (
          <PraznoStanje naslov="Korisnik nije clan nijedne javne grupe." />
        ) : (
          <ul className="divide-y rounded-md border">
            {clanstvaSirova.map((c) => (
              <li key={c.groups.id} className="p-3">
                <Link href={`/grupe/${c.groups.id}`} className="font-medium hover:underline">
                  {c.groups.naziv}
                </Link>
                {c.groups.subjects && (
                  <p className="text-sm text-gray-600">{c.groups.subjects.naziv}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
