import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/avatar'
import { createClient } from '@/lib/supabase/server'
import {
  napustiGrupu,
  obrisiGrupu,
  odbijZahtev,
  odobriZahtev,
  pridruziSe,
  ukloniClana,
} from '../actions'
import { Chat, type Poruka } from './chat'
import { IzmeniGrupu } from './izmeni-grupu'
import { PORUKA_STRANICA } from './poruka-stranica'
import { PotvrdaDugme } from './potvrda-dugme'

// Next.js 16: params i searchParams su Promise i moraju se await-ovati.
export default async function GrupaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ zahtev_greska?: string }>
}) {
  const { id } = await params
  const groupId = Number(id)
  if (Number.isNaN(groupId)) notFound()
  const sp = await searchParams

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

  // Sopstveni zahtev na cekanju - ako postoji, korisnik vec ceka odobrenje i ne
  // treba mu se ponuditi dugme za pridruzivanje niti pristup chatu (tiket 08).
  const { data: mojeClanstvo } = await supabase
    .from('group_members')
    .select('status')
    .eq('group_id', groupId)
    .eq('user_id', user!.id)
    .maybeSingle()
  const zahtevNaCekanju = mojeClanstvo?.status === 'na_cekanju'

  // Zahtevi na cekanju - vidljivi samo vlasniku (RLS: je_clan(group_id) je tacno
  // za vlasnika jer je i sam aktivan clan, pa moze da procita sve redove grupe,
  // ukljucujuci tudje zahteve na cekanju - vidi db.md, sekcija 4.3).
  const { data: zahtevi } = jeVlasnik
    ? await supabase
        .from('group_members')
        .select('user_id, joined_at, profiles(ime, skola, avatar_url)')
        .eq('group_id', groupId)
        .eq('status', 'na_cekanju')
        .order('joined_at', { ascending: true })
    : { data: null }

  const zahteviIds = (zahtevi ?? []).map((z) => z.user_id)
  const { data: zahteviPredmetiSirovi } = zahteviIds.length
    ? await supabase.from('user_subjects').select('user_id, subjects(naziv)').in('user_id', zahteviIds)
    : { data: null }

  const zahteviPredmeti: Record<string, string[]> = {}
  for (const p of zahteviPredmetiSirovi ?? []) {
    if (!p.subjects) continue
    ;(zahteviPredmeti[p.user_id] ??= []).push(p.subjects.naziv)
  }

  const imena: Record<string, string> = Object.fromEntries(
    (clanovi ?? []).map((c) => [c.user_id, c.profiles?.ime ?? 'Nepoznat'])
  )

  // Poruke su citljive samo clanovima (RLS), zato se ucitavaju uslovno. Ucitava se
  // PORUKA_STRANICA + 1 najnovijih (opadajuce po vremenu) da bi se iz jednog upita znalo
  // da li ima jos starijih - ako je vracen jedan visak, on se odbacuje pre prikaza, a
  // "Ucitaj starije poruke" u chat.tsx dovlaci ostatak na zahtev.
  let poruke: Poruka[] = []
  let imaStarijihPoruka = false
  if (jeClan) {
    const { data } = await supabase
      .from('messages')
      .select('id, tekst, user_id, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(PORUKA_STRANICA + 1)

    const sirove = data ?? []
    imaStarijihPoruka = sirove.length > PORUKA_STRANICA
    poruke = sirove
      .slice(0, PORUKA_STRANICA)
      .reverse()
      .map((p) => ({ ...p, autor: imena[p.user_id] ?? 'Nepoznat' }))
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
          ) : zahtevNaCekanju ? (
            <span className="shrink-0 text-sm text-gray-500">
              Zahtev poslat, ceka odobrenje vlasnika
            </span>
          ) : !grupa.is_public ? (
            <form action={pridruziSe}>
              <input type="hidden" name="group_id" value={grupa.id} />
              <button className="shrink-0 rounded-md bg-black px-3 py-1.5 text-sm text-white">
                Zatrazi pristup
              </button>
            </form>
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

      {sp.zahtev_greska === 'puna' && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          Zahtev nije odobren - grupa je vec popunjena. Povecaj maksimalan broj clanova ili
          ukloni nekog clana da bi napravio mesta.
        </p>
      )}

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

      {jeVlasnik && !grupa.is_public && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Zahtevi za clanstvo</h2>
          {!zahtevi?.length ? (
            <p className="text-sm text-gray-600">Trenutno nema zahteva na cekanju.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {zahtevi.map((z) => (
                <li key={z.user_id} className="flex items-center justify-between gap-4 p-3">
                  <Link href={`/profil/${z.user_id}`} className="flex min-w-0 items-center gap-3">
                    <Avatar
                      url={z.profiles?.avatar_url ?? null}
                      ime={z.profiles?.ime ?? 'Nepoznat'}
                      size={36}
                    />
                    <div className="min-w-0">
                      <p className="font-medium hover:underline">{z.profiles?.ime}</p>
                      {z.profiles?.skola && (
                        <p className="text-xs text-gray-500">{z.profiles.skola}</p>
                      )}
                      {zahteviPredmeti[z.user_id]?.length > 0 && (
                        <p className="truncate text-xs text-gray-500">
                          {zahteviPredmeti[z.user_id].join(', ')}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <form action={odobriZahtev}>
                      <input type="hidden" name="group_id" value={grupa.id} />
                      <input type="hidden" name="user_id" value={z.user_id} />
                      <button className="rounded-md bg-black px-3 py-1.5 text-sm text-white">
                        Prihvati
                      </button>
                    </form>
                    <form action={odbijZahtev}>
                      <input type="hidden" name="group_id" value={grupa.id} />
                      <input type="hidden" name="user_id" value={z.user_id} />
                      <button className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700">
                        Odbij
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
            imaStarijih={imaStarijihPoruka}
            imenaClanova={imena}
          />
        ) : zahtevNaCekanju ? (
          <p className="text-sm text-gray-600">
            Zahtev za clanstvo ceka odobrenje vlasnika. Videces poruke kad budes odobren.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Pridruzi se grupi da bi video i pisao poruke.
          </p>
        )}
      </section>
    </main>
  )
}
