# 05: Pretraga i filtriranje korisnika

**Šta se gradi:** Pored automatskih preporuka na početnoj strani, korisnik dobija stranu na
kojoj sam traži ljude: pretraga po imenu, filter po predmetu i po nivou znanja. Rezultati
i dalje pokazuju koliko predmeta dele sa njim. Korisnik koji još nije izabrao nijedan
predmet dobija poruku koja ga vodi na izbor predmeta umesto prazne liste.

**Blokiran od:** 04.

**Status:** zavrseno — potrebno pokrenuti migraciju `009_pretraga_korisnika.sql` u
Supabase SQL Editoru da bi RPC funkcija `pretrazi_korisnike` bila dostupna (vidi `db.md`).

## Kriterijumi prihvatanja

- [x] Postoji strana sa listom svih korisnika, dostupna iz glavne navigacije
- [x] Pretraga po imenu filtrira listu; pretraga ne razlikuje velika i mala slova
- [x] Filter po predmetu prikazuje samo korisnike koji uče izabrani predmet
- [x] Filter po nivou znanja radi u kombinaciji sa filterom po predmetu
- [x] Svaki rezultat prikazuje broj zajedničkih predmeta sa trenutnim korisnikom
- [x] Lista je sortirana po broju zajedničkih predmeta opadajuće
- [x] Aktivni filteri su vidljivi i mogu se pojedinačno poništiti
- [x] Stanje pretrage i filtera preživljava osvežavanje strane i može se podeliti linkom
- [x] Trenutni korisnik se ne pojavljuje u sopstvenim rezultatima
- [x] Prazan rezultat i stanje bez izabranih predmeta imaju različite, jasne poruke
