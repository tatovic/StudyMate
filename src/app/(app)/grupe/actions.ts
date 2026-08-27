'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { porukaGreskeBaze } from '@/lib/db-greske'
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

  if (error) return { greska: porukaGreskeBaze(error) }

  // Vlasnik je automatski i clan
  const { error: clanstvoGreska } = await supabase.from('group_members').insert({
    group_id: grupa.id,
    user_id: user.id,
    uloga: 'vlasnik',
    status: 'aktivan',
  })
  if (clanstvoGreska) return { greska: porukaGreskeBaze(clanstvoGreska) }

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

  const { data: grupa } = await supabase
    .from('groups')
    .select('is_public')
    .eq('id', groupId)
    .single()
  if (!grupa) return

  // Javnoj grupi se pridruzujes odmah; privatnoj samo saljes zahtev na cekanju
  // koji vlasnik odobrava ili odbija (tiket 08). Ako zahtev vec postoji,
  // primarni kljuc (group_id, user_id) odbija insert (23505) - to se tiho
  // ignorise jer znaci da je akcija vec izvrsena, ne da nesto nije u redu.
  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: user.id,
    uloga: 'clan',
    status: grupa.is_public ? 'aktivan' : 'na_cekanju',
  })

  revalidatePath('/grupe')
  revalidatePath(`/grupe/${groupId}`)
  revalidatePath('/dashboard')

  if (error && error.code !== '23505') {
    redirect(`/grupe/${groupId}?akcija_greska=1`)
  }
}

export async function napustiGrupu(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const groupId = Number(formData.get('group_id'))

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  revalidatePath('/grupe')
  revalidatePath('/dashboard')

  if (error) redirect(`/grupe/${groupId}?akcija_greska=1`)
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

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', clanId)

  revalidatePath(`/grupe/${groupId}`)
  revalidatePath('/grupe')

  if (error) redirect(`/grupe/${groupId}?akcija_greska=1`)
}

export async function odobriZahtev(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const groupId = Number(formData.get('group_id'))
  const podnosilacId = String(formData.get('user_id'))

  const { data: grupa } = await supabase
    .from('groups')
    .select('max_clanova')
    .eq('id', groupId)
    .eq('owner_id', user.id)
    .single()
  if (!grupa) return

  // Zahtev se ne moze odobriti ako bi grupa time premasila max_clanova - isti
  // razlog kao kod izmene max_clanova (zavisi od trenutnog stanja, ne moze biti
  // CHECK ogranicenje). Broji se samo status='aktivan', zahtevi na cekanju se
  // ne racunaju u popunjenost.
  const { count } = await supabase
    .from('group_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('status', 'aktivan')

  if (count !== null && count >= grupa.max_clanova) {
    redirect(`/grupe/${groupId}?zahtev_greska=puna`)
  }

  const { error } = await supabase
    .from('group_members')
    .update({ status: 'aktivan' })
    .eq('group_id', groupId)
    .eq('user_id', podnosilacId)
    .eq('status', 'na_cekanju')

  revalidatePath(`/grupe/${groupId}`)
  revalidatePath('/grupe')
  revalidatePath('/dashboard')

  if (error) redirect(`/grupe/${groupId}?akcija_greska=1`)
}

export async function odbijZahtev(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const groupId = Number(formData.get('group_id'))
  const podnosilacId = String(formData.get('user_id'))

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', podnosilacId)
    .eq('status', 'na_cekanju')

  revalidatePath(`/grupe/${groupId}`)

  if (error) redirect(`/grupe/${groupId}?akcija_greska=1`)
}

export async function obrisiGrupu(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const groupId = Number(formData.get('group_id'))

  // Clanstva i poruke se brisu automatski preko "on delete cascade" (001_schema.sql).
  const { error } = await supabase.from('groups').delete().eq('id', groupId).eq('owner_id', user.id)

  revalidatePath('/grupe')
  revalidatePath('/dashboard')

  if (error) redirect(`/grupe/${groupId}?akcija_greska=1`)
  redirect('/grupe?obrisana=1')
}
