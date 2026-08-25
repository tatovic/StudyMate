'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

    // Realtime: nove poruke stizu bez refresh-a.
    const kanal = supabase
      .channel(`grupa-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const nova = payload.new as Omit<Poruka, 'autor'>
          setPoruke((prev) =>
            prev.some((p) => p.id === nova.id)
              ? prev
              : [...prev, { ...nova, autor: imenaClanova[nova.user_id] ?? 'Nepoznat' }]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(kanal)
    }
  }, [groupId, imenaClanova])

  useEffect(() => {
    dno.current?.scrollIntoView({ behavior: 'smooth' })
  }, [poruke])

  async function posalji(e: React.FormEvent) {
    e.preventDefault()
    const sadrzaj = tekst.trim()
    if (!sadrzaj) return

    setSalje(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('messages')
      .insert({ group_id: groupId, user_id: userId, tekst: sadrzaj })

    if (!error) setTekst('')
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
