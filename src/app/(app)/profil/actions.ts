'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

  if (error) return { greska: error.message }

  revalidatePath('/profil')
  revalidatePath('/dashboard')
  return { poruka: 'Profil je sacuvan.' }
}

// Fajl se vec nalazi u skladistu (otpremljen direktno iz browsera na putanju
// "<user_id>/avatar" - vidi avatar-upload.tsx) - ovde se samo upisuje javni URL
// u profil. Putanja se gradi iz getUser(), nikad iz ulaza, pa korisnik moze
// postaviti sliku iskljucivo na sopstveni profil.
export async function sacuvajAvatar(): Promise<{ greska: string } | { avatarUrl: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { greska: 'Niste prijavljeni.' }

  const { data } = supabase.storage.from('avatars').getPublicUrl(`${user.id}/avatar`)
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) return { greska: error.message }

  revalidatePath('/profil')
  revalidatePath('/dashboard')
  revalidatePath('/grupe', 'layout')
  return { avatarUrl }
}
