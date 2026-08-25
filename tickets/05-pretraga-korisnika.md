# 05: Pretraga i filtriranje korisnika

**Šta se gradi:** Pored automatskih preporuka na početnoj strani, korisnik dobija stranu na
kojoj sam traži ljude: pretraga po imenu, filter po predmetu i po nivou znanja. Rezultati
i dalje pokazuju koliko predmeta dele sa njim. Korisnik koji još nije izabrao nijedan
predmet dobija poruku koja ga vodi na izbor predmeta umesto prazne liste.

**Blokiran od:** 04.

**Status:** spremno

## Kriterijumi prihvatanja

- [ ] Postoji strana sa listom svih korisnika, dostupna iz glavne navigacije
- [ ] Pretraga po imenu filtrira listu; pretraga ne razlikuje velika i mala slova
- [ ] Filter po predmetu prikazuje samo korisnike koji uče izabrani predmet
- [ ] Filter po nivou znanja radi u kombinaciji sa filterom po predmetu
- [ ] Svaki rezultat prikazuje broj zajedničkih predmeta sa trenutnim korisnikom
- [ ] Lista je sortirana po broju zajedničkih predmeta opadajuće
- [ ] Aktivni filteri su vidljivi i mogu se pojedinačno poništiti
- [ ] Stanje pretrage i filtera preživljava osvežavanje strane i može se podeliti linkom
- [ ] Trenutni korisnik se ne pojavljuje u sopstvenim rezultatima
- [ ] Prazan rezultat i stanje bez izabranih predmeta imaju različite, jasne poruke
