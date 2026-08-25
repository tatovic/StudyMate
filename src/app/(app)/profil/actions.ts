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
