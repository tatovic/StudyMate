'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { porukaGreskeBaze } from '@/lib/db-greske'
import { validirajSlikuProfila } from '@/lib/validacija'

export async function sacuvajProfil(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { greska: 'Niste prijavljeni.' }

  const ime = String(formData.get('ime') ?? '').trim()
  if (!ime) return { greska: 'Ime je obavezno.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      ime,
      skola: String(formData.get('skola') ?? '').trim() || null,
      opis: String(formData.get('opis') ?? '').trim() || null,
    })
    .eq('id', user.id)

  if (error) return { greska: porukaGreskeBaze(error) }

  revalidatePath('/profil')
  revalidatePath('/dashboard')
  return { poruka: 'Profil je sacuvan.' }
}

// Otpremanje ide kroz Server Action (ne direktno iz browsera u Storage) jer
// je to blize konvenciji projekta - sve mutacije idu kroz Server Actions.
// Zbog velicine slika je podignut bodySizeLimit u next.config.ts.
//
// Putanja se gradi iz getUser(), nikad iz ulaza, pa korisnik moze postaviti
// sliku iskljucivo na sopstveni profil. RLS je druga linija odbrane, ali
// paznja: politike nad storage.objects se NE oslanjaju na auth.uid(), jer
// on unutar Storage zahteva vraca NULL (vidi db.md, sekcija 8). Vlasnistvo
// se proverava preko owner_id kolone koju popunjava sam Storage servis.
export async function sacuvajAvatar(
  _prev: unknown,
  formData: FormData
): Promise<{ greska: string } | { avatarUrl: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { greska: 'Niste prijavljeni.' }

  const fajl = formData.get('slika')
  if (!(fajl instanceof File) || fajl.size === 0) return { greska: 'Izaberi sliku.' }

  const poruka = validirajSlikuProfila(fajl.type, fajl.size)
  if (poruka) return { greska: poruka }

  const putanja = `${user.id}/avatar`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(putanja, fajl, { upsert: true, contentType: fajl.type })

  if (uploadError) {
    console.error('Otpremanje avatara nije uspelo:', uploadError)
    return { greska: 'Slika nije mogla da se otpremi. Pokusaj ponovo.' }
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(putanja)
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) return { greska: porukaGreskeBaze(error) }

  revalidatePath('/profil')
  revalidatePath('/dashboard')
  revalidatePath('/grupe', 'layout')
  return { avatarUrl }
}
