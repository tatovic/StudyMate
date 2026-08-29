'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validirajTekstPoruke } from '@/lib/validacija'
import { PORUKA_STRANICA } from './poruka-stranica'

export type Poruka = {
  id: number
  tekst: string
  user_id: string
  created_at: string
  autor: string
}

function jeIstiDan(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDatumOznaka(datum: Date): string {
  const danas = new Date()
  if (jeIstiDan(datum, danas)) return 'Danas'
  const juce = new Date(danas)
  juce.setDate(danas.getDate() - 1)
  if (jeIstiDan(datum, juce)) return 'Juce'
  return new Intl.DateTimeFormat('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' }).format(datum)
}

function formatVreme(datum: Date): string {
  return new Intl.DateTimeFormat('sr-RS', { hour: '2-digit', minute: '2-digit' }).format(datum)
}

export function Chat({
  groupId,
  userId,
  pocetne,
  imaStarijih: imaStarijihPocetno,
  imenaClanova,
}: {
  groupId: number
  userId: string
  pocetne: Poruka[]
  imaStarijih: boolean
  imenaClanova: Record<string, string>
}) {
  const [poruke, setPoruke] = useState<Poruka[]>(pocetne)
  const [tekst, setTekst] = useState('')
  const [salje, setSalje] = useState(false)
  const [greska, setGreska] = useState<string | null>(null)
  const [imaStarijih, setImaStarijih] = useState(imaStarijihPocetno)
  const [ucitavaStarije, setUcitavaStarije] = useState(false)
  const [porukaZaBrisanje, setPorukaZaBrisanje] = useState<number | null>(null)
  const dno = useRef<HTMLDivElement>(null)
  const kontejner = useRef<HTMLDivElement>(null)
  const poslednjaIdRef = useRef<number | null>(null)
  // Kad se dodaju starije poruke na vrh, skrol treba da ostane vizuelno na istom mestu
  // umesto da skoci na vrh - ovaj ref nosi izmerenu visinu/poziciju pre dodavanja, a
  // useLayoutEffect ispod je primenjuje posle sto DOM dobije nove poruke, pre iscrtavanja.
  const obnoviSkrolRef = useRef<{ visina: number; skrol: number } | null>(null)

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
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'messages' },
          (payload) => {
            // "old" nosi sve kolone (ukljucujuci group_id) samo zato sto je messages
            // REPLICA IDENTITY FULL (012_realtime_brisanje_poruka.sql) - podrazumevano bi
            // nosio samo primarni kljuc i Realtime ne bi mogao da proveri RLS pa dogadjaj
            // ne bi stigao nikome. Vidi tech.md, Poznate zamke.
            const obrisana = payload.old as { id: number; group_id: number }
            if (obrisana.group_id !== groupId) return
            setPoruke((prev) => prev.filter((p) => p.id !== obrisana.id))
          }
        )
        .subscribe()
    })

    return () => {
      otkazano = true
      if (kanal) supabase.removeChannel(kanal)
    }
  }, [groupId, imenaClanova])

  useLayoutEffect(() => {
    if (obnoviSkrolRef.current && kontejner.current) {
      const { visina, skrol } = obnoviSkrolRef.current
      kontejner.current.scrollTop = kontejner.current.scrollHeight - visina + skrol
      obnoviSkrolRef.current = null
    }
  }, [poruke])

  useEffect(() => {
    // Skroluje na dno samo kad se doda nova poruka na kraj (posalji/Realtime INSERT), ne i
    // kad se na pocetak dodaju starije poruke (o tome brine efekat iznad) ili kad se neka
    // poruka obrise - u oba ta slucaja se poslednja poruka u nizu ne menja.
    const zadnja = poruke[poruke.length - 1]
    if (zadnja && zadnja.id !== poslednjaIdRef.current) {
      poslednjaIdRef.current = zadnja.id
      dno.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [poruke])

  async function ucitajStarije() {
    if (ucitavaStarije || !imaStarijih || !poruke.length) return
    setUcitavaStarije(true)
    const kont = kontejner.current
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('id, tekst, user_id, created_at')
      .eq('group_id', groupId)
      .lt('created_at', poruke[0].created_at)
      .order('created_at', { ascending: false })
      .limit(PORUKA_STRANICA)

    const starije = (data ?? [])
      .map((p) => ({ ...p, autor: imenaClanova[p.user_id] ?? 'Nepoznat' }))
      .reverse()

    setImaStarijih(starije.length === PORUKA_STRANICA)
    if (starije.length && kont) {
      obnoviSkrolRef.current = { visina: kont.scrollHeight, skrol: kont.scrollTop }
      setPoruke((prev) => [...starije, ...prev])
    }
    setUcitavaStarije(false)
  }

  async function posalji(e: React.FormEvent) {
    e.preventDefault()
    const sadrzaj = tekst.trim()
    if (validirajTekstPoruke(sadrzaj)) return

    setSalje(true)
    setGreska(null)
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
    } else {
      setGreska('Poruka nije poslata. Pokusaj ponovo.')
    }
    setSalje(false)
  }

  async function obrisi(id: number) {
    const supabase = createClient()
    // .eq('user_id', userId) je odbrana u dubinu, ne jedina zastita - RLS politika
    // "brises svoje poruke" vec odbija brisanje tudje poruke na nivou baze.
    const { error } = await supabase.from('messages').delete().eq('id', id).eq('user_id', userId)
    if (!error) {
      setPoruke((prev) => prev.filter((p) => p.id !== id))
    }
    setPorukaZaBrisanje(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={kontejner} className="h-80 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        {!poruke.length && (
          <p className="text-sm text-gray-500">Jos nema poruka. Zapocni razgovor.</p>
        )}

        {imaStarijih && (
          <div className="text-center">
            <button
              type="button"
              onClick={ucitajStarije}
              disabled={ucitavaStarije}
              className="text-xs text-gray-500 underline disabled:opacity-50"
            >
              {ucitavaStarije ? 'Ucitavanje...' : 'Ucitaj starije poruke'}
            </button>
          </div>
        )}

        {poruke.map((p, i) => {
          const prethodna = poruke[i - 1]
          const datumP = new Date(p.created_at)
          const noviDan = !prethodna || !jeIstiDan(new Date(prethodna.created_at), datumP)
          const noviAutor = noviDan || prethodna.user_id !== p.user_id
          const svoja = p.user_id === userId

          return (
            <div key={p.id}>
              {noviDan && (
                <p className="my-3 text-center text-xs text-gray-400">{formatDatumOznaka(datumP)}</p>
              )}
              <div className={`${svoja ? 'text-right' : ''} ${noviAutor ? 'mt-3' : 'mt-0.5'}`}>
                <div
                  className={`inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    svoja ? 'bg-indigo-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {noviAutor && !svoja && (
                    <p className="mb-0.5 text-xs font-medium opacity-70">{p.autor}</p>
                  )}
                  <p className="whitespace-pre-wrap">{p.tekst}</p>
                  <p className={`mt-0.5 text-[10px] ${svoja ? 'text-gray-300' : 'text-gray-400'}`}>
                    {formatVreme(datumP)}
                  </p>
                </div>
                {svoja && (
                  <div>
                    {porukaZaBrisanje === p.id ? (
                      <span className="text-xs text-red-700">
                        Obrisati poruku?{' '}
                        <button
                          type="button"
                          onClick={() => obrisi(p.id)}
                          className="font-medium underline"
                        >
                          Da
                        </button>{' '}
                        <button
                          type="button"
                          onClick={() => setPorukaZaBrisanje(null)}
                          className="underline"
                        >
                          Ne
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPorukaZaBrisanje(p.id)}
                        className="text-xs text-gray-400 hover:text-red-700 hover:underline"
                      >
                        Obrisi
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={dno} />
      </div>

      {greska && <p className="text-sm text-red-700">{greska}</p>}

      <form onSubmit={posalji} className="flex gap-2">
        <input
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          maxLength={2000}
          placeholder="Napisi poruku..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          disabled={salje || !tekst.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Posalji
        </button>
      </form>
    </div>
  )
}
