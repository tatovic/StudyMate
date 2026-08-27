import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { obrisiTestKorisnika } from '../helpers/admin'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../helpers/env'
import { registrujTestKorisnika, type TestKorisnik } from '../helpers/nalog'

// Ovi testovi rade nad pravom Supabase bazom iz .env.local i proveravaju da RLS
// politike iz 002_rls.sql stvarno rade, ne samo da postoje. Svaki test pravi
// sopstvene test korisnike; ciscenje ide preko obrisiTestKorisnika, koje se oslanja
// na "on delete cascade" da pokupi sve sto su ti korisnici napravili (vidi db.md).

describe('Pravila pristupa (RLS)', () => {
  let vlasnik: TestKorisnik
  let gost: TestKorisnik
  let groupId: number
  let privatnaGroupId: number

  beforeAll(async () => {
    vlasnik = await registrujTestKorisnika('vlasnik')
    gost = await registrujTestKorisnika('gost')

    const { data: predmet, error: predmetGreska } = await vlasnik.supabase
      .from('subjects')
      .select('id')
      .limit(1)
      .single()
    if (predmetGreska || !predmet) throw new Error('Nema predmeta u bazi - pokreni 004_seed.sql.')

    const { data: grupa, error: grupaGreska } = await vlasnik.supabase
      .from('groups')
      .insert({ naziv: '[TEST RLS] grupa', subject_id: predmet.id, owner_id: vlasnik.userId })
      .select('id')
      .single()
    if (grupaGreska || !grupa) throw new Error(`Kreiranje test grupe nije uspelo: ${grupaGreska?.message}`)
    groupId = grupa.id

    await vlasnik.supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: vlasnik.userId, uloga: 'vlasnik', status: 'aktivan' })

    await vlasnik.supabase
      .from('messages')
      .insert({ group_id: groupId, user_id: vlasnik.userId, tekst: 'tajna poruka clanova' })

    const { data: privatnaGrupa, error: privatnaGreska } = await vlasnik.supabase
      .from('groups')
      .insert({
        naziv: '[TEST RLS] privatna grupa',
        subject_id: predmet.id,
        owner_id: vlasnik.userId,
        is_public: false,
      })
      .select('id')
      .single()
    if (privatnaGreska || !privatnaGrupa)
      throw new Error(`Kreiranje privatne test grupe nije uspelo: ${privatnaGreska?.message}`)
    privatnaGroupId = privatnaGrupa.id

    await vlasnik.supabase
      .from('group_members')
      .insert({ group_id: privatnaGroupId, user_id: vlasnik.userId, uloga: 'vlasnik', status: 'aktivan' })
  })

  afterAll(async () => {
    await obrisiTestKorisnika(vlasnik.userId)
    await obrisiTestKorisnika(gost.userId)
  })

  it('korisnik ne moze procitati poruke grupe cij nije clan', async () => {
    const { data, error } = await gost.supabase.from('messages').select('*').eq('group_id', groupId)
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('korisnik ne moze izmeniti tudji profil', async () => {
    const { data: rezultatIzmene } = await gost.supabase
      .from('profiles')
      .update({ ime: 'Hakovano ime' })
      .eq('id', vlasnik.userId)
      .select()
    expect(rezultatIzmene).toEqual([])

    const { data: profil } = await vlasnik.supabase
      .from('profiles')
      .select('ime')
      .eq('id', vlasnik.userId)
      .single()
    expect(profil?.ime).not.toBe('Hakovano ime')
  })

  it('korisnik ne moze izmeniti tudju grupu', async () => {
    const { data } = await gost.supabase
      .from('groups')
      .update({ naziv: 'Preuzeto' })
      .eq('id', groupId)
      .select()
    expect(data).toEqual([])

    const { data: grupa } = await vlasnik.supabase.from('groups').select('naziv').eq('id', groupId).single()
    expect(grupa?.naziv).toBe('[TEST RLS] grupa')
  })

  it('korisnik ne moze obrisati tudju grupu', async () => {
    const { data } = await gost.supabase.from('groups').delete().eq('id', groupId).select()
    expect(data).toEqual([])

    const { data: grupa } = await vlasnik.supabase.from('groups').select('id').eq('id', groupId).maybeSingle()
    expect(grupa?.id).toBe(groupId)
  })

  it('nečlan vidi clanstva javne grupe (za javni profil, tiket 04)', async () => {
    const { data, error } = await gost.supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', vlasnik.userId)
    expect(error).toBeNull()
    expect(data).toEqual([{ user_id: vlasnik.userId }])
  })

  it('nečlan ne vidi clanstva privatne grupe', async () => {
    const { data, error } = await gost.supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', privatnaGroupId)
      .eq('user_id', vlasnik.userId)
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('neprijavljen posetilac ne dobija nijedan red iz baze', async () => {
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { data, error } = await anon.from('subjects').select('*')
    expect(data ?? []).toEqual([])
    expect(error).not.toBeNull()
  })
})
