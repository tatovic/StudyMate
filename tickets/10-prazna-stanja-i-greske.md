# 10: Prazna stanja, učitavanje i obrada grešaka

**Šta se gradi:** Aplikacija se ponaša predvidivo i kada nešto nedostaje ili pođe naopako.
Novi korisnik kroz prazna stanja biva vođen ka prvom smislenom koraku umesto da gleda
prazne liste. Spore strane pokazuju da se učitavaju. Greška prikazuje poruku na srpskom sa
mogućnošću ponovnog pokušaja, umesto neuhvaćenog izuzetka. Sve radi i na telefonu.

**Blokiran od:** 09.

**Status:** zavrseno

## Kriterijumi prihvatanja

- [x] Svaka lista u aplikaciji ima prazno stanje sa jasnim sledećim korakom
- [x] Novoregistrovan korisnik je sa početne strane usmeren na izbor predmeta
- [x] Strane koje čekaju podatke prikazuju stanje učitavanja umesto praznog ekrana
- [x] Neuhvaćena greška prikazuje poruku na srpskom sa dugmetom za ponovni pokušaj
- [x] Nepostojeća putanja prikazuje stranu „nije pronađeno" u izgledu aplikacije
- [x] Svaka forma prikazuje stanje slanja i onemogućava dvostruko slanje
- [x] Greške iz baze se prikazuju kao razumljive poruke, ne kao sirovi tekst greške
- [x] Navigacija i sve strane su upotrebljive na širini mobilnog ekrana
- [x] Duga imena, opisi i nazivi grupa ne razbijaju raspored
- [x] Interaktivni elementi su dostupni tastaturom i imaju vidljiv fokus
