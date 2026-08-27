'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function dodajPredmet(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Predmet vec dodat (isti primarni kljuc) - 23505 se tiho ignorise, akcija je
  // vec izvrsena.
  const { error } = await supabase.from('user_subjects').insert({
    user_id: user.id,
    subject_id: Number(formData.get('subject_id')),
    nivo: String(formData.get('nivo') ?? 'srednji'),
  })

  revalidatePath('/predmeti')
  revalidatePath('/dashboard')

  if (error && error.code !== '23505') redirect('/predmeti?akcija_greska=1')
}

export async function ukloniPredmet(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('user_subjects')
    .delete()
    .eq('user_id', user.id)
    .eq('subject_id', Number(formData.get('subject_id')))

  revalidatePath('/predmeti')
  revalidatePath('/dashboard')

  if (error) redirect('/predmeti?akcija_greska=1')
}
