'use client'

import { useState, type ChangeEvent } from 'react'
import { Avatar } from '@/components/avatar'
import { createClient } from '@/lib/supabase/client'
import { DOZVOLJENI_TIPOVI_SLIKE, validirajSlikuProfila } from '@/lib/validacija'
import { sacuvajAvatar } from './actions'

export function AvatarUpload({
  userId,
  ime,
  avatarUrl,
}: {
  userId: string
  ime: string
  avatarUrl: string | null
}) {
  const [url, setUrl] = useState(avatarUrl)
  const [greska, setGreska] = useState<string | null>(null)
  const [otprema, setOtprema] = useState(false)

  async function izaberiSliku(e: ChangeEvent<HTMLInputElement>) {
    const fajl = e.target.files?.[0]
    e.target.value = ''
    if (!fajl) return

    const poruka = validirajSlikuProfila(fajl.type, fajl.size)
    if (poruka) {
      setGreska(poruka)
      return
    }

    setGreska(null)
    setOtprema(true)

    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`${userId}/avatar`, fajl, { upsert: true, contentType: fajl.type })

    if (uploadError) {
      setGreska('Slika nije mogla da se otpremi. Pokusaj ponovo.')
      setOtprema(false)
      return
    }

    const rezultat = await sacuvajAvatar()
    setOtprema(false)

    if ('greska' in rezultat) {
      setGreska(rezultat.greska)
      return
    }

    setUrl(rezultat.avatarUrl)
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar url={url} ime={ime} size={72} />
      <div className="flex flex-col gap-1">
        <label className="w-fit cursor-pointer rounded-md border px-3 py-1.5 text-sm">
          {otprema ? 'Otpremanje...' : 'Promeni sliku'}
          <input
            type="file"
            accept={DOZVOLJENI_TIPOVI_SLIKE.join(',')}
            className="hidden"
            disabled={otprema}
            onChange={izaberiSliku}
          />
        </label>
        {greska && <p className="text-sm text-red-600">{greska}</p>}
      </div>
    </div>
  )
}
