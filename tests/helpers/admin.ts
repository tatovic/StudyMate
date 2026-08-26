import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env'

// Service_role kljuc se koristi ISKLJUCIVO ovde, u test kodu, da bi se posle testa
// obrisao test korisnik. Aplikacija u src/ ga nikad ne koristi (vidi tech.md 5.2).
// Zahvaljujuci "on delete cascade" lancu u 001_schema.sql, brisanje auth korisnika
// automatski obrise i njegov profil, predmete, grupe, clanstva i poruke.
function kreirajAdminKlijent() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY nije podesen u .env.local - potreban je testovima ' +
        'da bi mogli da obrisu test korisnike koje sami naprave (vidi tech.md).'
    )
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function obrisiTestKorisnika(userId: string) {
  const admin = kreirajAdminKlijent()
  await admin.auth.admin.deleteUser(userId)
}

export async function nadjiKorisnikaPoImenu(ime: string) {
  const admin = kreirajAdminKlijent()
  const { data } = await admin.from('profiles').select('id').eq('ime', ime).maybeSingle()
  return data?.id as string | undefined
}
