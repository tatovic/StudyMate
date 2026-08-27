# 04: Javni profil drugog korisnika

**Šta se gradi:** Korisnik klikne na nekog iz liste sličnih korisnika ili iz liste članova
grupe i otvara njegov javni profil: ime, škola, opis, slika, predmeti sa nivoima znanja i
javne grupe čiji je taj korisnik član. Jasno se vidi koji su predmeti zajednički sa
posmatračem, jer je to razlog zbog kog ga je i našao.

**Blokiran od:** 03.

**Status:** zavrseno — potrebno pokrenuti migraciju `008_javni_profil.sql` u Supabase
SQL Editoru da bi prikaz javnih grupa i pripadajući RLS test proradili (vidi `db.md`).

## Kriterijumi prihvatanja

- [x] Sa liste sličnih korisnika i sa liste članova grupe vodi link na javni profil
- [x] Profil prikazuje ime, školu, opis i sliku
- [x] Profil prikazuje predmete korisnika sa nivoom znanja
- [x] Predmeti zajednički sa posmatračem su vizuelno izdvojeni
- [x] Profil prikazuje javne grupe čiji je korisnik član, sa linkom ka grupi — kod
      napisan, zahteva migraciju `008` (vidi napomenu iznad)
- [x] Privatne grupe tog korisnika se ne prikazuju posmatraču koji nije njihov član
- [x] Email adresa se nigde ne prikazuje (kolona ne postoji u `profiles`)
- [x] Otvaranje sopstvenog javnog profila nudi prečicu ka izmeni profila
- [x] Nepostojeći korisnik daje stranu „nije pronađeno", ne grešku
