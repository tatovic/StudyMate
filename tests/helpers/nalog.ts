import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

export function noviTestEmail(oznaka: string) {
  return `studymate-test-${oznaka}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
}

export type TestKorisnik = {
  supabase: SupabaseClient
  userId: string
  email: string
  ime: string
}

// Registruje pravog korisnika preko anon kljuca (isto sto radi i register forma).
// Zahteva da "Confirm email" bude iskljucen u test Supabase projektu (vidi db.md 6),
// inace signUp ne vraca odmah aktivnu sesiju.
export async function registrujTestKorisnika(oznaka: string): Promise<TestKorisnik> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const email = noviTestEmail(oznaka)
  const ime = `Test ${oznaka} ${Date.now()}`
  const lozinka = 'lozinka123'

  const { data, error } = await supabase.auth.signUp({
    email,
    password: lozinka,
    options: { data: { ime } },
  })

  if (error || !data.user || !data.session) {
    throw new Error(
      `Registracija test korisnika nije uspela: ${error?.message ?? 'nema sesije posle signUp-a'}. ` +
        'Proveri da li je "Confirm email" iskljucen u test Supabase projektu (db.md, sekcija 6).'
    )
  }

  return { supabase, userId: data.user.id, email, ime }
}
