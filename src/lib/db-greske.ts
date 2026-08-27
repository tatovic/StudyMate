import type { PostgrestError } from '@supabase/supabase-js'

// Supabase/Postgres vraca greske sa SQLSTATE kodovima i porukama na engleskom
// koje ne treba prikazivati korisniku direktno. Ovde se prevode u razumljive
// poruke na srpskom, isti pristup kao auth-greske.ts za greske prijave.
const PORUKE: Record<string, string> = {
  '23505': 'Ovaj podatak vec postoji.',
  '23503': 'Povezani podatak ne postoji ili je u medjuvremenu uklonjen.',
  '23514': 'Uneti podaci ne zadovoljavaju ogranicenja.',
  '42501': 'Nemas dozvolu za ovu radnju.',
}

export function porukaGreskeBaze(
  error: PostgrestError,
  podrazumevana = 'Doslo je do greske. Pokusaj ponovo.'
): string {
  return PORUKE[error.code] ?? podrazumevana
}
