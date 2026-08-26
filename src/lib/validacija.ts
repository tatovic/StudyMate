// Cista validaciona logika bez baze i bez mreze - testira se u tests/unit/validacija.test.ts.
// Pravila ovde prate ogranicenja koja vec postoje u bazi (vidi db.md), samo ih prijavljuju
// korisniku ranije i razumljivijom porukom nego sirova Postgres greska.

export function validirajNazivGrupe(naziv: string): string | null {
  if (!naziv.trim()) return 'Naziv grupe je obavezan.'
  return null
}

// Prati CHECK (max_clanova between 2 and 100) iz 001_schema.sql.
export function validirajMaxClanova(vrednost: number): string | null {
  if (!Number.isInteger(vrednost)) return 'Maksimalan broj clanova mora biti ceo broj.'
  if (vrednost < 2 || vrednost > 100) return 'Maksimalan broj clanova mora biti izmedju 2 i 100.'
  return null
}

// Prati CHECK (char_length(tekst) between 1 and 2000) iz 001_schema.sql.
export function validirajTekstPoruke(tekst: string): string | null {
  const ocisceno = tekst.trim()
  if (!ocisceno) return 'Poruka ne moze biti prazna.'
  if (ocisceno.length > 2000) return 'Poruka je predugacka (najvise 2000 karaktera).'
  return null
}

// Prati minLength={6} sa register/login forme i weak_password prag u auth-greske.ts.
export function validirajLozinku(lozinka: string): string | null {
  if (lozinka.length < 6) return 'Lozinka mora imati bar 6 karaktera.'
  return null
}
