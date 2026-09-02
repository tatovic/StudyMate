import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { obrisiTestKorisnika } from '../helpers/admin'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../helpers/env'
import { registrujTestKorisnika, type TestKorisnik } from '../helpers/nalog'

// Ovi testovi rade nad pravom Supabase bazom iz .env.local i proveravaju da RLS
// politike iz 002_rls.sql stvarno rade, ne samo da postoje. Svaki test pravi
// sopstvene test korisnike; ciscenje ide preko obrisiTestKorisnika, koje se oslanja
// na "on delete cascade" da pokupi sve sto su ti korisnici napravili.

describe('Pravila pristupa (RLS)', () => {
  let vlasnik: TestKorisnik
  let gost: TestKorisnik
  let clan1: TestKorisnik
  let clan2: TestKorisnik
  let groupId: number
  let privatnaGroupId: number

  beforeAll(async () => {
    vlasnik = await registrujTestKorisnika('vlasnik')
    gost = await registrujTestKorisnika('gost')
    clan1 = await registrujTestKorisnika('clan1')
    clan2 = await registrujTestKorisnika('clan2')

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

    await clan1.supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: clan1.userId, uloga: 'clan', status: 'aktivan' })
    await clan2.supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: clan2.userId, uloga: 'clan', status: 'aktivan' })
  })

  afterAll(async () => {
    await obrisiTestKorisnika(vlasnik.userId)
    await obrisiTestKorisnika(gost.userId)
    await obrisiTestKorisnika(clan1.userId)
    await obrisiTestKorisnika(clan2.userId)
  })

  it('korisnik ne moze procitati poruke grupe cij nije clan', async () => {
    const { data, error } = await gost.supabase.from('messages').select('*').eq('group_id', groupId)
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('korisnik brise sopstvenu poruku (tiket 09)', async () => {
    const { data: nova } = await clan1.supabase
      .from('messages')
      .insert({ group_id: groupId, user_id: clan1.userId, tekst: '[TEST RLS] poruka za brisanje' })
      .select('id')
      .single()

    const { data, error } = await clan1.supabase.from('messages').delete().eq('id', nova!.id).select('id')
    expect(error).toBeNull()
    expect(data).toEqual([{ id: nova!.id }])

    const { data: proverena } = await vlasnik.supabase
      .from('messages')
      .select('id')
      .eq('id', nova!.id)
      .maybeSingle()
    expect(proverena).toBeNull()
  })

  it('korisnik ne moze obrisati tudju poruku (tiket 09)', async () => {
    const { data: tudja } = await clan1.supabase
      .from('messages')
      .insert({ group_id: groupId, user_id: clan1.userId, tekst: '[TEST RLS] tudja poruka' })
      .select('id')
      .single()

    const { data } = await clan2.supabase.from('messages').delete().eq('id', tudja!.id).select()
    expect(data).toEqual([])

    const { data: proverena } = await vlasnik.supabase
      .from('messages')
      .select('id')
      .eq('id', tudja!.id)
      .maybeSingle()
    expect(proverena?.id).toBe(tudja!.id)
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

  it('vlasnik moze izmeniti svoju grupu', async () => {
    const { data, error } = await vlasnik.supabase
      .from('groups')
      .update({ opis: '[TEST RLS] izmenjen opis' })
      .eq('id', groupId)
      .select()
    expect(error).toBeNull()
    expect(data?.[0]?.opis).toBe('[TEST RLS] izmenjen opis')
  })

  it('vlasnik uklanja clana iz svoje grupe (tiket 07)', async () => {
    const { data, error } = await vlasnik.supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', clan1.userId)
      .select('group_id, user_id')
    expect(error).toBeNull()
    expect(data).toEqual([{ group_id: groupId, user_id: clan1.userId }])

    const { data: clanstvo } = await vlasnik.supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', clan1.userId)
      .maybeSingle()
    expect(clanstvo).toBeNull()
  })

  it('obican clan ne moze ukloniti drugog clana iz grupe', async () => {
    const { data } = await clan2.supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', vlasnik.userId)
      .select()
    expect(data).toEqual([])

    const { data: clanstvo } = await vlasnik.supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', vlasnik.userId)
      .maybeSingle()
    expect(clanstvo?.user_id).toBe(vlasnik.userId)
  })

  it('brisanje grupe brise i njena clanstva i poruke (kaskadno)', async () => {
    const { data: predmet } = await vlasnik.supabase.from('subjects').select('id').limit(1).single()

    const { data: grupaZaBrisanje } = await vlasnik.supabase
      .from('groups')
      .insert({ naziv: '[TEST RLS] grupa za brisanje', subject_id: predmet!.id, owner_id: vlasnik.userId })
      .select('id')
      .single()
    const idGrupe = grupaZaBrisanje!.id

    await vlasnik.supabase
      .from('group_members')
      .insert({ group_id: idGrupe, user_id: vlasnik.userId, uloga: 'vlasnik', status: 'aktivan' })
    await vlasnik.supabase
      .from('messages')
      .insert({ group_id: idGrupe, user_id: vlasnik.userId, tekst: '[TEST RLS] poruka pred brisanje' })

    const { error } = await vlasnik.supabase.from('groups').delete().eq('id', idGrupe)
    expect(error).toBeNull()

    const { data: clanstva } = await vlasnik.supabase.from('group_members').select('*').eq('group_id', idGrupe)
    expect(clanstva).toEqual([])

    const { data: poruke } = await vlasnik.supabase.from('messages').select('*').eq('group_id', idGrupe)
    expect(poruke).toEqual([])
  })

  it('nečlan vidi privatnu grupu u pretrazi po nazivu (tiket 08)', async () => {
    const { data, error } = await gost.supabase
      .from('groups')
      .select('id, naziv')
      .eq('id', privatnaGroupId)
      .maybeSingle()
    expect(error).toBeNull()
    expect(data?.naziv).toBe('[TEST RLS] privatna grupa')
  })

  it('korisnik salje zahtev za clanstvo u privatnu grupu (tiket 08)', async () => {
    const { data, error } = await gost.supabase
      .from('group_members')
      .insert({ group_id: privatnaGroupId, user_id: gost.userId, uloga: 'clan', status: 'na_cekanju' })
      .select('group_id, user_id, status')
    expect(error).toBeNull()
    expect(data).toEqual([{ group_id: privatnaGroupId, user_id: gost.userId, status: 'na_cekanju' }])
  })

  it('isti korisnik ne moze poslati isti zahtev dvaput (primarni kljuc)', async () => {
    const { error } = await gost.supabase
      .from('group_members')
      .insert({ group_id: privatnaGroupId, user_id: gost.userId, uloga: 'clan', status: 'na_cekanju' })
    expect(error).not.toBeNull()
  })

  it('korisnik ne moze zaobici odobravanje i direktno postati aktivan clan privatne grupe', async () => {
    const { error } = await clan2.supabase
      .from('group_members')
      .insert({ group_id: privatnaGroupId, user_id: clan2.userId, uloga: 'clan', status: 'aktivan' })
      .select()
    expect(error).not.toBeNull()
  })

  it('obican clan ne moze odobriti tudji zahtev za clanstvo', async () => {
    const { data } = await clan1.supabase
      .from('group_members')
      .update({ status: 'aktivan' })
      .eq('group_id', privatnaGroupId)
      .eq('user_id', gost.userId)
      .select()
    expect(data).toEqual([])

    const { data: zahtev } = await vlasnik.supabase
      .from('group_members')
      .select('status')
      .eq('group_id', privatnaGroupId)
      .eq('user_id', gost.userId)
      .single()
    expect(zahtev?.status).toBe('na_cekanju')
  })

  it('vlasnik odobrava zahtev za clanstvo (tiket 08)', async () => {
    const { data, error } = await vlasnik.supabase
      .from('group_members')
      .update({ status: 'aktivan' })
      .eq('group_id', privatnaGroupId)
      .eq('user_id', gost.userId)
      .select('status')
    expect(error).toBeNull()
    expect(data).toEqual([{ status: 'aktivan' }])
  })

  it('neprijavljen posetilac ne dobija nijedan red iz baze', async () => {
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { data, error } = await anon.from('subjects').select('*')
    expect(data ?? []).toEqual([])
    expect(error).not.toBeNull()
  })
})
