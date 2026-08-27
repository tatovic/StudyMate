'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validirajNazivGrupe, validirajMaxClanova } from '@/lib/validacija'

export async function napraviGrupu(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { greska: 'Niste prijavljeni.' }

  const naziv = String(formData.get('naziv') ?? '').trim()
  const nazivGreska = validirajNazivGrupe(naziv)
  if (nazivGreska) return { greska: nazivGreska }

  const maxClanova = Number(formData.get('max_clanova') ?? 10)
  const maxClanovaGreska = validirajMaxClanova(maxClanova)
  if (maxClanovaGreska) return { greska: maxClanovaGreska }

  const { data: grupa, error } = await supabase
    .from('groups')
    .insert({
      naziv,
      opis: String(formData.get('opis') ?? '').trim() || null,
      subject_id: Number(formData.get('subject_id')),
      owner_id: user.id,
      max_clanova: maxClanova,
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

export async function izmeniGrupu(_prev: unknown, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { greska: 'Niste prijavljeni.' }

  const groupId = Number(formData.get('group_id'))

  const naziv = String(formData.get('naziv') ?? '').trim()
  const nazivGreska = validirajNazivGrupe(naziv)
  if (nazivGreska) return { greska: nazivGreska }

  const maxClanova = Number(formData.get('max_clanova') ?? 10)
  const maxClanovaGreska = validirajMaxClanova(maxClanova)
  if (maxClanovaGreska) return { greska: maxClanovaGreska }

  // Ne moze se smanjiti ispod trenutnog broja clanova - ovo zavisi od stanja baze
  // u trenutku izmene, pa ne moze biti CHECK ogranicenje niti cista funkcija u
  // validacija.ts (vidi tech.md, 8.1).
  const { count } = await supabase
    .from('group_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('status', 'aktivan')

  if (count !== null && maxClanova < count) {
    return {
      greska: `Maksimalan broj clanova ne moze biti manji od trenutnog broja clanova (${count}).`,
    }
  }

  const { error } = await supabase
    .from('groups')
    .update({
      naziv,
      opis: String(formData.get('opis') ?? '').trim() || null,
      subject_id: Number(formData.get('subject_id')),
      max_clanova: maxClanova,
      is_public: formData.get('is_public') === 'on',
    })
    .eq('id', groupId)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return { greska: 'Izmena nije uspela. Da li si vlasnik ove grupe?' }

  revalidatePath(`/grupe/${groupId}`)
  revalidatePath('/grupe')
  return { poruka: 'Grupa je azurirana.' }
}

export async function ukloniClana(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const groupId = Number(formData.get('group_id'))
  const clanId = String(formData.get('user_id'))

  // Vlasnik ne moze ukloniti sebe - vidi napomenu u db.md, sekcija 4.3.
  if (clanId === user.id) return

  await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', clanId)

  revalidatePath(`/grupe/${groupId}`)
  revalidatePath('/grupe')
}

export async function obrisiGrupu(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const groupId = Number(formData.get('group_id'))

  // Clanstva i poruke se brisu automatski preko "on delete cascade" (001_schema.sql).
  await supabase.from('groups').delete().eq('id', groupId).eq('owner_id', user.id)

  revalidatePath('/grupe')
  revalidatePath('/dashboard')
  redirect('/grupe?obrisana=1')
}
