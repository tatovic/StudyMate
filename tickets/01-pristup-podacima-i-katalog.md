# 01: Popraviti pristup podacima i potvrditi katalog predmeta

**Šta se gradi:** Prijavljen korisnik otvara stranu „Predmeti" i vidi ceo katalog predmeta
grupisan po kategorijama. Trenutno je lista prazna jer baza odbija upit sa
`42501: permission denied for table subjects` — rola `authenticated` ima RLS politike,
ali nema tabelarne privilegije. Isti problem pogađa svaku tabelu, pa je ovo blokada
za sve ostalo.

**Blokiran od:** ničega (može odmah).

**Status:** zavrseno

## Zašto prvo

RLS i GRANT su dva odvojena sloja. GRANT odlučuje sme li rola uopšte da dodirne tabelu,
RLS koje redove vidi. Bez GRANT-a PostgREST odbija upit pre nego što RLS uopšte dođe na
red. Dok se ovo ne reši, nijedna strana koja čita podatke ne radi, pa nijedan drugi tiket
nije proverljiv.

## Kriterijumi prihvatanja

- [x] Migracija sa GRANT-ovima za rolu `authenticated` postoji u `supabase/migrations/`
      i pokrenuta je na Supabase projektu
- [x] Rola `anon` nema pristup nijednoj tabeli aplikacije
- [x] Sve RPC funkcije imaju `grant execute` za `authenticated`
- [x] Strana „Predmeti" prikazuje sve predmete iz kataloga, grupisane po kategorijama
- [x] Dodavanje i uklanjanje predmeta radi i odmah se odražava na početnoj strani
- [x] Početna strana prikazuje sličnog korisnika kada dva naloga dele bar jedan predmet
- [x] Kreiranje grupe, pridruživanje i slanje poruke prolaze bez greške o privilegijama
- [x] Provera zdravlja baze iz `db.md` sekcija 7 vraća očekivane vrednosti
- [x] `db.md` ažuriran ako je bilo izmena u odnosu na dokumentovano stanje

## Dodato u opsegu ovog tiketa

Poruke o grešci pri prijavi i registraciji sada razlikuju stvarni uzrok umesto jedne
uopštene poruke. Nepotvrđen nalog, isključen email provajder i pogrešna lozinka daju
tri različite poruke. Bez toga je dijagnostika vodila u pogrešnom pravcu — što se i
desilo tokom provere ovog tiketa.

## Kako je provereno

| Kriterijum | Metod | Rezultat |
|---|---|---|
| `anon` nema pristup | Direktan poziv REST APIja bez sesije nad svih 6 tabela | `42501` na svakoj |
| Katalog predmeta | Strana „Predmeti" u browseru | 15 predmeta, 4 kategorije |
| Dodavanje predmeta | Dodat „Programiranje/napredni" i „Baze podataka/srednji" | Brojač 0 → 2, nivoi tačni |
| Uklanjanje predmeta | Uklonjen predmet, pa otvorena početna strana | Broj zajedničkih pao 2 → 1 |
| Preporuke korisnika | Dva naloga sa istim predmetima | Rangiranje tačno, opadajuće |
| RPC funkcije | `pronadji_slicne` i `preporuci_grupe` kao prijavljen korisnik | Obe vraćaju podatke |
| Kreiranje grupe | Grupa napravljena kroz UI | Vlasnik automatski član |
| Pridruživanje | Drugi nalog se pridružio javnoj grupi | Broj članova 1 → 2 |
| Slanje poruke | Poruka poslata iz chata | Upisana u bazu, vidljiva posle osvežavanja |

## Nalazi za druge tikete

Tokom provere otkrivena su dva defekta koja nisu u opsegu ovog tiketa i prebačena su
u „Poznati nedostaci" u `prd.md`:

1. Poslata poruka se ne prikazuje pošiljaocu dok se strana ne osveži → tiket 09
2. Broj članova grupe je 0 za sve grupe čiji korisnik nije član → tiket 06
