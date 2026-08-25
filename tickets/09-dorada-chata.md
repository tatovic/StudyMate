# 09: Dorada chata — vreme, brisanje, starije poruke

**Šta se gradi:** Chat postaje upotrebljiv za stvaran razgovor. Uz svaku poruku stoji vreme
slanja, poruke istog autora u nizu se grupišu, korisnik može obrisati sopstvenu poruku, a
grupe sa dugom istorijom učitavaju starije poruke na zahtev umesto da se sve dovlači odjednom.

**Blokiran od:** 08.

**Status:** spremno

## Kriterijumi prihvatanja

- [ ] Uz svaku poruku prikazano je vreme slanja u čitljivom formatu
- [ ] Poruke iz različitih dana su razdvojene oznakom datuma
- [ ] Uzastopne poruke istog autora se grupišu bez ponavljanja imena
- [ ] Korisnik briše sopstvenu poruku uz potvrdu
- [ ] Obrisana poruka nestaje i kod ostalih članova uživo, bez osvežavanja
- [ ] Korisnik ne može obrisati tuđu poruku; pokušaj je odbijen i na nivou baze
- [ ] Chat inicijalno učitava ograničen broj poslednjih poruka
- [ ] Starije poruke se dodatno učitavaju na zahtev, uz očuvanje pozicije skrola
- [ ] Poslata poruka se prikazuje odmah pošiljaocu i ne duplira se kada stigne uživo
- [ ] Neuspešno slanje prikazuje grešku i ne gubi otkucani tekst
- [ ] Prazan ili samo-razmak tekst se ne šalje
