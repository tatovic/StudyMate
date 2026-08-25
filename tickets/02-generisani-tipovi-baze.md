# 02: Generisani tipovi baze umesto ručnih override-a

**Šta se gradi:** Upiti prema bazi su tipizirani na osnovu stvarne šeme. Kada neko
preimenuje kolonu ili promeni tip, `tsc` to prijavi umesto da se greška pojavi tek u
browseru. Za korisnika se ništa ne menja — ovo je priprema koja sve naredne tikete čini
bržim i sigurnijim.

**Blokiran od:** 01.5.

**Status:** spremno

## Zašto sada

Bez tipova baze `supabase-js` pretpostavlja da je svaka embedovana relacija niz, iako
many-to-one veza vraća objekat, pa se to ručno gasi `.overrideTypes<>()` pozivima na
svakom upitu. Svaki naredni tiket dodaje nove upite i time nove ručne override-e.
Jeftinije je uvesti generisane tipove sada nego ih naknadno provlačiti kroz duplo više
mesta. „Napravi promenu lakom, pa onda napravi laku promenu."

## Kriterijumi prihvatanja

- [ ] Tipovi baze se generišu iz Supabase šeme i čuvaju u repou
- [ ] Postoji npm skripta za regeneraciju tipova, dokumentovana u `tech.md`
- [ ] Supabase klijenti (browser, server, proxy) su parametrizovani tipom baze
- [ ] Svi `.overrideTypes<>()` pozivi su uklonjeni, a upiti i dalje prolaze proveru tipova
- [ ] Rezultati RPC funkcija su tipizirani; nema ručnog kastovanja rezultata
- [ ] Nigde u kodu nema `any`
- [ ] `npx tsc --noEmit`, `npm run lint` i `npm run build` prolaze
- [ ] `tech.md` sekcija o tipovima embedovanih relacija ažurirana da odražava novo stanje
