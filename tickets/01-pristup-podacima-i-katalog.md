# 01: Popraviti pristup podacima i potvrditi katalog predmeta

**Šta se gradi:** Prijavljen korisnik otvara stranu „Predmeti" i vidi ceo katalog predmeta
grupisan po kategorijama. Trenutno je lista prazna jer baza odbija upit sa
`42501: permission denied for table subjects` — rola `authenticated` ima RLS politike,
ali nema tabelarne privilegije. Isti problem pogađa svaku tabelu, pa je ovo blokada
za sve ostalo.

**Blokiran od:** ničega (može odmah).

**Status:** spremno

## Zašto prvo

RLS i GRANT su dva odvojena sloja. GRANT odlučuje sme li rola uopšte da dodirne tabelu,
RLS koje redove vidi. Bez GRANT-a PostgREST odbija upit pre nego što RLS uopšte dođe na
red. Dok se ovo ne reši, nijedna strana koja čita podatke ne radi, pa nijedan drugi tiket
nije proverljiv.

## Kriterijumi prihvatanja

- [ ] Migracija sa GRANT-ovima za rolu `authenticated` postoji u `supabase/migrations/`
      i pokrenuta je na Supabase projektu
- [ ] Rola `anon` nema pristup nijednoj tabeli aplikacije
- [ ] Sve RPC funkcije imaju `grant execute` za `authenticated`
- [ ] Strana „Predmeti" prikazuje sve predmete iz kataloga, grupisane po kategorijama
- [ ] Dodavanje i uklanjanje predmeta radi i odmah se odražava na početnoj strani
- [ ] Početna strana prikazuje sličnog korisnika kada dva naloga dele bar jedan predmet
- [ ] Kreiranje grupe, pridruživanje i slanje poruke prolaze bez greške o privilegijama
- [ ] Provera zdravlja baze iz `db.md` sekcija 7 vraća očekivane vrednosti
- [ ] `db.md` ažuriran ako je bilo izmena u odnosu na dokumentovano stanje
