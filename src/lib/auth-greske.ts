import type { AuthError } from '@supabase/supabase-js'

// Supabase vraca greske na engleskom i sa kodovima koji se ne vide korisniku.
// Ovde se prevode u poruke na srpskom koje kazu sta konkretno nije u redu.
// Uopstena poruka "pogresan email ili lozinka" za sve slucajeve odvodi u pogresnom
// pravcu: nepotvrdjen nalog i iskljucen provajder nemaju veze sa lozinkom.
const PORUKE: Record<string, string> = {
  invalid_credentials: 'Pogresan email ili lozinka.',
  email_not_confirmed:
    'Nalog jos nije potvrdjen. Proveri email i klikni na link za potvrdu.',
  email_provider_disabled:
    'Prijava email adresom je trenutno onemogucena. Kontaktiraj administratora.',
  signup_disabled: 'Registracija je trenutno onemogucena.',
  user_banned: 'Ovaj nalog je blokiran.',
  over_request_rate_limit:
    'Previse pokusaja u kratkom roku. Sacekaj malo pa probaj ponovo.',
  user_already_exists: 'Nalog sa ovom email adresom vec postoji.',
  email_exists: 'Nalog sa ovom email adresom vec postoji.',
  weak_password: 'Lozinka je previse slaba. Koristi bar 6 karaktera.',
  validation_failed: 'Uneti podaci nisu ispravni.',
}

export function porukaGreske(error: AuthError, podrazumevana: string): string {
  return (error.code && PORUKE[error.code]) || podrazumevana
}
