'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validirajTekstPoruke } from '@/lib/validacija'

export type Poruka = {
  id: number
  tekst: string
  user_id: string
  created_at: string
  autor: string
}

export function Chat({
  groupId,
  userId,
  pocetne,
  imenaClanova,
}: {
  groupId: number
  userId: string
  pocetne: Poruka[]
  imenaClanova: Record<string, string>
}) {
  const [poruke, setPoruke] = useState<Poruka[]>(pocetne)
  const [tekst, setTekst] = useState('')
  const [salje, setSalje] = useState(false)
  const dno = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    let otkazano = false
    let kanal: ReturnType<typeof supabase.channel> | null = null

    // Realtime za RLS-zasticenu tabelu proverava autorizaciju preko JWT-a na soketu,
    // a taj JWT se postavlja tek posle ucitavanja sesije - ako se pretplati odmah po
    // kreiranju novog klijenta, sesija jos nije stigla i provera pada na
    // "Error 401: Unauthorized" (poruka nikad ne stigne). Zato se ceka getSession().
    supabase.auth.getSession().then(() => {
      if (otkazano) return

      // Namerno BEZ server-side "filter" - Supabase Realtime ga odbija sa
      // "invalid column for filter group_id" jer group_id nema samostalan indeks
      // (vidi tech.md, Poznate zamke). RLS vec ogranicava koje redove korisnik uopste
      // prima, pa se filtriranje po konkretnoj grupi radi ovde.
      kanal = supabase
        .channel(`grupa-${groupId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const nova = payload.new as Omit<Poruka, 'autor'> & { group_id: number }
            if (nova.group_id !== groupId) return
            setPoruke((prev) =>
              prev.some((p) => p.id === nova.id)
                ? prev
                : [...prev, { ...nova, autor: imenaClanova[nova.user_id] ?? 'Nepoznat' }]
            )
          }
        )
        .subscribe()
    })

    return () => {
      otkazano = true
      if (kanal) supabase.removeChannel(kanal)
    }
  }, [groupId, imenaClanova])

  useEffect(() => {
    dno.current?.scrollIntoView({ behavior: 'smooth' })
  }, [poruke])

  async function posalji(e: React.FormEvent) {
    e.preventDefault()
    const sadrzaj = tekst.trim()
    if (validirajTekstPoruke(sadrzaj)) return

    setSalje(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .insert({ group_id: groupId, user_id: userId, tekst: sadrzaj })
      .select('id, tekst, user_id, created_at')
      .single()

    // Sopstvena poruka se prikazuje odmah, ne ceka se Realtime povratna informacija -
    // pretplata (iznad) moze da se uspostavi i posle ovog trenutka, pa bi cekanje na nju
    // ovde ostavilo posiljaoca da gleda praznu poruku dok se ne osvezi stranica.
    if (!error && data) {
      setTekst('')
      setPoruke((prev) =>
        prev.some((p) => p.id === data.id)
          ? prev
          : [...prev, { ...data, autor: imenaClanova[userId] ?? 'Nepoznat' }]
      )
    }
    setSalje(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-80 space-y-2 overflow-y-auto rounded-md border p-3">
        {!poruke.length && (
          <p className="text-sm text-gray-500">Jos nema poruka. Zapocni razgovor.</p>
        )}
        {poruke.map((p) => (
          <div key={p.id} className={p.user_id === userId ? 'text-right' : ''}>
            <div
              className={`inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                p.user_id === userId ? 'bg-black text-white' : 'bg-gray-100'
              }`}
            >
              {p.user_id !== userId && (
                <p className="mb-0.5 text-xs font-medium opacity-70">{p.autor}</p>
              )}
              <p className="whitespace-pre-wrap">{p.tekst}</p>
            </div>
          </div>
        ))}
        <div ref={dno} />
      </div>

      <form onSubmit={posalji} className="flex gap-2">
        <input
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          maxLength={2000}
          placeholder="Napisi poruku..."
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          disabled={salje || !tekst.trim()}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Posalji
        </button>
      </form>
    </div>
  )
}
