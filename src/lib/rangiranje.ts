// Cista logika rangiranja preporuka bez baze i bez mreze - testira se u tests/unit/rangiranje.test.ts.
// Redosled ovde mora ostati isti kao u RPC funkcijama pronadji_slicne i preporuci_grupe
// (003_matching.sql) - primenjuje se nad njihovim rezultatom kao eksplicitna, testirana
// garancija poretka, nezavisna od toga da li se SQL upit ikad promeni.

export type SlicanKorisnik = {
  id: string
  ime: string
  skola: string | null
  opis: string | null
  avatar_url: string | null
  zajednicki: number
  predmeti: string[]
}

// Isto poredjenje kao "order by zajednicki desc, p.ime" u pronadji_slicne.
export function rangirajSlicneKorisnike(
  korisnici: SlicanKorisnik[],
  limitN: number
): SlicanKorisnik[] {
  return [...korisnici]
    .sort((a, b) => b.zajednicki - a.zajednicki || a.ime.localeCompare(b.ime))
    .slice(0, limitN)
}

export type PreporucenaGrupa = {
  id: number
  naziv: string
  opis: string | null
  predmet: string
  broj_clanova: number
  max_clanova: number
}

// Isto poredjenje kao "order by broj_clanova desc" u preporuci_grupe.
export function rangirajPreporuceneGrupe(
  grupe: PreporucenaGrupa[],
  limitN: number
): PreporucenaGrupa[] {
  return [...grupe].sort((a, b) => b.broj_clanova - a.broj_clanova).slice(0, limitN)
}
