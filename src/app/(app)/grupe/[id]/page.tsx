import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/avatar'
import { createClient } from '@/lib/supabase/server'
import { napustiGrupu, obrisiGrupu, pridruziSe, ukloniClana } from '../actions'
import { Chat, type Poruka } from './chat'
import { IzmeniGrupu } from './izmeni-grupu'
import { PotvrdaDugme } from './potvrda-dugme'

// Next.js 16: params je Promise i mora se await-ovati.
export default async function GrupaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const groupId = Number(id)
  if (Number.isNaN(groupId)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: grupa } = await supabase
    .from('groups')
    .select('id, naziv, opis, subject_id, max_clanova, is_public, owner_id, subjects(naziv)')
    .eq('id', groupId)
    .single()

  // RLS vraca prazno ako grupa ne postoji ili korisnik nema pravo da je vidi.
  if (!grupa) notFound()

  const jeVlasnik = grupa.owner_id === user!.id

  const { data: predmeti } = jeVlasnik
    ? await supabase.from('subjects').select('id, naziv').order('naziv')
    : { data: null }

  const { data: clanovi } = await supabase
    .from('group_members')
    .select('user_id, uloga, profiles(ime, skola, avatar_url)')
    .eq('group_id', groupId)
    .eq('status', 'aktivan')

  const jeClan = (clanovi ?? []).some((c) => c.user_id === user!.id)
  const puna = (clanovi?.length ?? 0) >= grupa.max_clanova

  const imena: Record<string, string> = Object.fromEntries(
    (clanovi ?? []).map((c) => [c.user_id, c.profiles?.ime ?? 'Nepoznat'])
  )

  // Poruke su citljive samo clanovima (RLS), zato se ucitavaju uslovno.
  let poruke: Poruka[] = []
  if (jeClan) {
    const { data } = await supabase
      .from('messages')
      .select('id, tekst, user_id, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100)

    poruke = (data ?? []).map((p) => ({ ...p, autor: imena[p.user_id] ?? 'Nepoznat' }))
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/grupe" className="text-sm text-gray-600 hover:underline">
        &larr; Sve grupe
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{grupa.naziv}</h1>
          <p className="text-sm text-gray-600">
            {grupa.subjects?.naziv ?? 'bez predmeta'} · {clanovi?.length ?? 0}/{grupa.max_clanova}{' '}
            clanova{!grupa.is_public && ' · privatna'}
          </p>
          {grupa.opis && <p className="mt-2 text-sm text-gray-700">{grupa.opis}</p>}
        </div>

        {!jeVlasnik &&
          (jeClan ? (
            <PotvrdaDugme
              action={napustiGrupu}
              dugme="Napusti grupu"
              poruka="Sigurno zelis da napustis ovu grupu?"
              potvrdaLabela="Da, napusti"
            >
              <input type="hidden" name="group_id" value={grupa.id} />
            </PotvrdaDugme>
          ) : puna ? (
            <span className="shrink-0 text-sm text-gray-500">Grupa je popunjena</span>
          ) : (
            <form action={pridruziSe}>
              <input type="hidden" name="group_id" value={grupa.id} />
              <button className="shrink-0 rounded-md bg-black px-3 py-1.5 text-sm text-white">
                Pridruzi se
              </button>
            </form>
          ))}
      </header>

      {jeVlasnik && (
        <section className="flex flex-wrap items-start justify-between gap-4 rounded-md border p-4">
          <div>
            <h2 className="text-sm font-medium text-gray-700">Upravljanje grupom</h2>
            <p className="text-xs text-gray-500">Vidljivo samo tebi, kao vlasniku grupe.</p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <IzmeniGrupu
              grupa={{
                id: grupa.id,
                naziv: grupa.naziv,
                opis: grupa.opis,
                subject_id: grupa.subject_id,
                max_clanova: grupa.max_clanova,
                is_public: grupa.is_public,
              }}
              predmeti={predmeti ?? []}
            />
            <PotvrdaDugme
              action={obrisiGrupu}
              dugme="Obrisi grupu"
              poruka="Ova radnja je trajna. Brisanjem grupe brisu se sva njena clanstva i sve njene poruke, i to se ne moze ponistiti."
              potvrdaLabela="Da, obrisi grupu"
              opasno
            >
              <input type="hidden" name="group_id" value={grupa.id} />
            </PotvrdaDugme>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Clanovi</h2>
        <ul className="divide-y rounded-md border">
          {(clanovi ?? []).map((c) => (
            <li key={c.user_id} className="flex items-center justify-between p-3">
              <Link href={`/profil/${c.user_id}`} className="flex items-center gap-3">
                <Avatar url={c.profiles?.avatar_url ?? null} ime={c.profiles?.ime ?? 'Nepoznat'} size={36} />
                <div>
                  <p className="font-medium hover:underline">{c.profiles?.ime}</p>
                  {c.profiles?.skola && (
                    <p className="text-xs text-gray-500">{c.profiles.skola}</p>
                  )}
                </div>
              </Link>
              {c.uloga === 'vlasnik' ? (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">vlasnik</span>
              ) : (
                jeVlasnik && (
                  <PotvrdaDugme
                    action={ukloniClana}
                    dugme="Ukloni"
                    poruka={`Ukloniti ${c.profiles?.ime ?? 'ovog clana'} iz grupe? Izgubice pristup chatu.`}
                    potvrdaLabela="Da, ukloni"
                    opasno
                  >
                    <input type="hidden" name="group_id" value={grupa.id} />
                    <input type="hidden" name="user_id" value={c.user_id} />
                  </PotvrdaDugme>
                )
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Chat</h2>
        {jeClan ? (
          <Chat
            groupId={grupa.id}
            userId={user!.id}
            pocetne={poruke}
            imenaClanova={imena}
          />
        ) : (
          <p className="text-sm text-gray-600">
            Pridruzi se grupi da bi video i pisao poruke.
          </p>
        )}
      </section>
    </main>
  )
}
