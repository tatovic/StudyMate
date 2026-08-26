import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { napustiGrupu, pridruziSe } from '../actions'
import { Chat, type Poruka } from './chat'

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
    .select('id, naziv, opis, max_clanova, is_public, owner_id, subjects(naziv)')
    .eq('id', groupId)
    .single()

  // RLS vraca prazno ako grupa ne postoji ili korisnik nema pravo da je vidi.
  if (!grupa) notFound()

  const { data: clanovi } = await supabase
    .from('group_members')
    .select('user_id, uloga, profiles(ime, skola)')
    .eq('group_id', groupId)
    .eq('status', 'aktivan')

  const jeClan = (clanovi ?? []).some((c) => c.user_id === user!.id)
  const jeVlasnik = grupa.owner_id === user!.id
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

        {jeClan ? (
          !jeVlasnik && (
            <form action={napustiGrupu}>
              <input type="hidden" name="group_id" value={grupa.id} />
              <button className="shrink-0 rounded-md border px-3 py-1.5 text-sm">
                Napusti grupu
              </button>
            </form>
          )
        ) : puna ? (
          <span className="shrink-0 text-sm text-gray-500">Grupa je popunjena</span>
        ) : (
          <form action={pridruziSe}>
            <input type="hidden" name="group_id" value={grupa.id} />
            <button className="shrink-0 rounded-md bg-black px-3 py-1.5 text-sm text-white">
              Pridruzi se
            </button>
          </form>
        )}
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Clanovi</h2>
        <ul className="divide-y rounded-md border">
          {(clanovi ?? []).map((c) => (
            <li key={c.user_id} className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium">{c.profiles?.ime}</p>
                {c.profiles?.skola && (
                  <p className="text-xs text-gray-500">{c.profiles.skola}</p>
                )}
              </div>
              {c.uloga === 'vlasnik' && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">vlasnik</span>
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
