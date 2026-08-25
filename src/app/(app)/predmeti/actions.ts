'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function dodajPredmet(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('user_subjects').insert({
    user_id: user.id,
    subject_id: Number(formData.get('subject_id')),
    nivo: String(formData.get('nivo') ?? 'srednji'),
  })

  revalidatePath('/predmeti')
  revalidatePath('/dashboard')
}

export async function ukloniPredmet(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('user_subjects')
    .delete()
    .eq('user_id', user.id)
    .eq('subject_id', Number(formData.get('subject_id')))

  revalidatePath('/predmeti')
  revalidatePath('/dashboard')
}
