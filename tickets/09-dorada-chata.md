# 09: Dorada chata — vreme, brisanje, starije poruke

**Šta se gradi:** Chat postaje upotrebljiv za stvaran razgovor. Uz svaku poruku stoji vreme
slanja, poruke istog autora u nizu se grupišu, korisnik može obrisati sopstvenu poruku, a
grupe sa dugom istorijom učitavaju starije poruke na zahtev umesto da se sve dovlači odjednom.

**Blokiran od:** 08.

**Status:** zavrseno — potrebno pokrenuti migraciju `012_realtime_brisanje_poruka.sql` u
Supabase (menja `REPLICA IDENTITY` na `messages`, neophodno da DELETE stigne uživo
ostalim članovima — vidi `db.md`, sekcija 3.6)

## Kriterijumi prihvatanja

- [x] Uz svaku poruku prikazano je vreme slanja u čitljivom formatu
- [x] Poruke iz različitih dana su razdvojene oznakom datuma
- [x] Uzastopne poruke istog autora se grupišu bez ponavljanja imena
- [x] Korisnik briše sopstvenu poruku uz potvrdu
- [x] Obrisana poruka nestaje i kod ostalih članova uživo, bez osvežavanja
      (zahteva `REPLICA IDENTITY FULL` — vidi napomenu uz Status)
- [x] Korisnik ne može obrisati tuđu poruku; pokušaj je odbijen i na nivou baze
      (RLS politika "brises svoje poruke" iz `002_rls.sql`, pokriveno testovima u
      `tests/rls/pristup-podacima.test.ts`)
- [x] Chat inicijalno učitava ograničen broj poslednjih poruka
- [x] Starije poruke se dodatno učitavaju na zahtev, uz očuvanje pozicije skrola
- [x] Poslata poruka se prikazuje odmah pošiljaocu i ne duplira se kada stigne uživo
      (rešeno usput u tiketu 01.5, dok se ispravljao e2e test — vidi `chat.tsx` i
      poznati nedostatak N-1 u `prd.md`; ostatak ovog tiketa nije dirat)
- [x] Neuspešno slanje prikazuje grešku i ne gubi otkucani tekst
- [x] Prazan ili samo-razmak tekst se ne šalje
