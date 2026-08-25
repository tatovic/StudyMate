'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function napraviGrupu(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { greska: 'Niste prijavljeni.' }

  const naziv = String(formData.get('naziv') ?? '').trim()
  if (!naziv) return { greska: 'Naziv grupe je obavezan.' }

  const { data: grupa, error } = await supabase
    .from('groups')
    .insert({
      naziv,
      opis: String(formData.get('opis') ?? '').trim() || null,
      subject_id: Number(formData.get('subject_id')),
      owner_id: user.id,
      max_clanova: Number(formData.get('max_clanova') ?? 10),
      is_public: formData.get('is_public') === 'on',
    })
    .select('id')
    .single()

  if (error) return { greska: error.message }

  // Vlasnik je automatski i clan
  await supabase.from('group_members').insert({
    group_id: grupa.id,
    user_id: user.id,
    uloga: 'vlasnik',
    status: 'aktivan',
  })

  revalidatePath('/grupe')
  redirect(`/grupe/${grupa.id}`)
}

export async function pridruziSe(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const groupId = Number(formData.get('group_id'))

  await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: user.id,
    uloga: 'clan',
    status: 'aktivan',
  })

  revalidatePath('/grupe')
  revalidatePath(`/grupe/${groupId}`)
  revalidatePath('/dashboard')
}

export async function napustiGrupu(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const groupId = Number(formData.get('group_id'))

  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  revalidatePath('/grupe')
  revalidatePath('/dashboard')
  redirect('/grupe')
}
