# prd.md — StudyMate

> Izvor istine za **šta** gradimo i **dokle smo stigli**.
> Tehničke odluke su u [tech.md](./tech.md), model podataka u [db.md](./db.md).
>
> **Po završetku tiketa obavezno štiklirati kvačicu u sekciji 8 ovog fajla**
> i u odgovarajućem fajlu u `tickets/`. To je jedini pouzdan zapis napretka.

---

## 1. Vizija

StudyMate povezuje učenike i studente koji uče iste predmete, kako bi zajedno učili i
pripremali se za ispite. Umesto da svako traži partnera za učenje po grupama na društvenim
mrežama, platforma na osnovu izabranih predmeta automatski predlaže ljude sa istim
interesovanjima i grupe kojima se može pridružiti.

**Problem koji rešava:** pronalaženje partnera za učenje je nasumično i zavisi od poznanstava.

**Rešenje:** eksplicitan model interesovanja (predmeti) + rangiranje po preklapanju +
grupe sa ugrađenom komunikacijom.

---

## 2. Korisnici

| Persona | Opis | Glavna potreba |
|---|---|---|
| **Srednjoškolac** | Priprema se za maturu ili prijemni | Naći nekoga iz istog grada/škole za isti predmet |
| **Student** | Sprema ispit u ispitnom roku | Grupa za konkretan predmet, brzo, pred rok |
| **Organizator grupe** | Pravi i vodi grupu za učenje | Kontrola nad članstvom i dogovaranje termina |

---

## 3. Ključni koncepti (rečnik)

Ovi termini se koriste dosledno u kodu, bazi i UI. Ne uvoditi sinonime.

| Termin | Značenje | U bazi |
|---|---|---|
| **Profil** | Javni podaci o korisniku | `profiles` |
| **Predmet** | Stavka iz kataloga predmeta | `subjects` |
| **Moji predmeti** | Predmeti koje korisnik uči, sa nivoom znanja | `user_subjects` |
| **Nivo** | `pocetnik` / `srednji` / `napredni` | `user_subjects.nivo` |
| **Grupa** | Grupa za učenje vezana za jedan predmet | `groups` |
| **Član** | Korisnik u grupi, uloga `vlasnik` ili `clan` | `group_members` |
| **Sličan korisnik** | Korisnik sa preklapanjem u „mojim predmetima" | RPC `pronadji_slicne` |
| **Preporučena grupa** | Javna grupa iz mojih predmeta gde nisam član | RPC `preporuci_grupe` |

---

## 4. Funkcionalni zahtevi

### 4.1 Nalog i autentifikacija

- **FR-1** Korisnik se registruje email adresom, lozinkom (min. 6 karaktera) i imenom.
- **FR-2** Registracijom se automatski kreira profil (trigger u bazi).
- **FR-3** Korisnik se prijavljuje email adresom i lozinkom; pogrešni podaci daju jasnu poruku.
- **FR-4** Korisnik se odjavljuje sa bilo koje strane u aplikaciji.
- **FR-5** Neprijavljen korisnik ne može pristupiti nijednoj strani osim landinga, prijave i registracije.
- **FR-6** Prijavljen korisnik na landingu biva preusmeren na početnu stranu aplikacije.

### 4.2 Profil

- **FR-7** Korisnik menja svoje ime, školu/fakultet i opis.
- **FR-8** Korisnik postavlja i menja sliku profila.
- **FR-9** Korisnik vidi javni profil drugog korisnika: ime, škola, opis, avatar, predmeti sa nivoima, javne grupe čiji je član.
- **FR-10** Email adresa se **ne prikazuje** drugim korisnicima.

### 4.3 Predmeti

- **FR-11** Korisnik vidi katalog predmeta grupisan po kategorijama.
- **FR-12** Korisnik dodaje predmet u „moje predmete" uz izbor nivoa znanja.
- **FR-13** Korisnik uklanja predmet iz svojih predmeta.
- **FR-14** Isti predmet se ne može dodati dvaput.

### 4.4 Povezivanje

- **FR-15** Početna strana prikazuje korisnike rangirane po broju zajedničkih predmeta, opadajuće.
- **FR-16** Za svakog predloženog korisnika prikazuje se broj i lista zajedničkih predmeta.
- **FR-17** Korisnik može pretražiti sve korisnike po imenu i filtrirati ih po predmetu i nivou.
- **FR-18** Korisnik bez izabranih predmeta dobija poruku koja ga vodi na izbor predmeta.

### 4.5 Grupe

- **FR-19** Korisnik pravi grupu: naziv, predmet, opis, maksimalan broj članova, javna/privatna.
- **FR-20** Kreator grupe automatski postaje član sa ulogom `vlasnik`.
- **FR-21** Korisnik vidi listu javnih grupa i grupa čiji je član.
- **FR-22** Korisnik pretražuje grupe po nazivu i filtrira po predmetu.
- **FR-23** Korisnik se pridružuje javnoj grupi koja nije popunjena.
- **FR-24** Korisnik napušta grupu; vlasnik ne može napustiti sopstvenu grupu.
- **FR-25** Vlasnik menja podatke grupe i briše grupu.
- **FR-26** Vlasnik uklanja člana iz grupe.
- **FR-27** Za privatnu grupu korisnik šalje zahtev za članstvo; vlasnik ga odobrava ili odbija.
- **FR-28** Strana grupe prikazuje listu članova sa oznakom vlasnika i popunjenost (`n/max`).

### 4.6 Komunikacija

- **FR-29** Članovi grupe razmenjuju poruke u chatu grupe.
- **FR-30** Nove poruke stižu uživo, bez osvežavanja strane.
- **FR-31** Uz poruku se prikazuje autor i vreme slanja.
- **FR-32** Korisnik briše sopstvenu poruku.
- **FR-33** Nečlan ne vidi sadržaj chata.

---

## 5. Nefunkcionalni zahtevi

- **NFR-1** Sva autorizacija se sprovodi u bazi (RLS + GRANT). Klijentski ključ je javan i ne sme biti jedina zaštita.
- **NFR-2** Korisnički podaci se čitaju u Server Componentima; klijent ne dohvata podatke u `useEffect`.
- **NFR-3** Aplikacija radi na mobilnom i desktop prikazu.
- **NFR-4** Svaka lista ima definisano prazno stanje sa jasnim sledećim korakom.
- **NFR-5** Svaka akcija koja menja podatke ima vidljivo stanje učitavanja i poruku o grešci.
- **NFR-6** `npx tsc --noEmit`, `npm run lint` i `npm run build` moraju prolaziti pre svakog commita.

---

## 6. Van opsega (za sada)

Namerno **ne** gradimo: privatne poruke jedan-na-jedan, video pozive, deljenje fajlova,
kalendar i zakazivanje termina, ocenjivanje korisnika, mobilnu aplikaciju, notifikacije
putem emaila, plaćanja.

---

## 7. Trenutno stanje

Implementirano i radi:

- Registracija, prijava, odjava (Server Actions), zaštita ruta kroz `proxy.ts` i layout
- Landing strana sa preusmeravanjem prijavljenih
- Početna strana sa preporukama korisnika i grupa (RPC pozivi)
- Izbor predmeta sa nivoom znanja
- Izmena profila (ime, škola, opis)
- Lista grupa, kreiranje grupe, pridruživanje, napuštanje
- Strana grupe sa listom članova i chatom
- Baza: 5 migracija, RLS na svim tabelama, 2 RPC funkcije

### Poznati nedostaci

Otkriveni tokom provere tiketa 01. Nijedan nije blokada, ali se ne smeju izgubiti:

| # | Nedostatak | Uzrok | Rešava |
|---|---|---|---|
| ~~N-1~~ | ~~Poslata poruka se ne vidi pošiljaocu dok se strana ne osveži~~ | **Rešeno u tiketu 01.5.** Uzrok nije bio samo nedostatak optimističkog dodavanja u komponenti — e2e test je otkrio da je Realtime pretplata sa `filter: group_id=eq.X` padala na `"invalid column for filter"` (kolona nema samostalan indeks), a i bez filtera je autorizacija na soketu (JWT) ponekad kasnila. Vidi `chat.tsx` i `tech.md` → Poznate zamke. | — |
| N-2 | Broj članova grupe se prikazuje kao `0/10` za svaku grupu čiji korisnik nije član | RLS politika nad `group_members` dozvoljava čitanje samo sopstvenih članstava i članstava svojih grupa, pa agregatni `count` nečlanu vraća nulu. Posledično ni „popunjena grupa" ne radi. | tiket 06 |

N-2 traži odluku pre implementacije: da li je spisak članova javne grupe vidljiv svim
prijavljenim korisnicima. Ako jeste — rešava se novom RLS politikom; ako nije — brojanje
mora u `security definer` funkciju koja vraća samo broj, bez identiteta članova.

---

## 8. Tiketi

Tiketi su hronološki — svaki je blokiran prethodnim, radi se odozgo nadole.
Puni opis i kriterijumi prihvatanja su u `tickets/`.

**Kada završiš tiket:** štikliraj kvačicu ovde **i** promeni `**Status:**` u
odgovarajućem fajlu iz `tickets/` u `zavrseno`.

- [x] **01** — [Popraviti pristup podacima i potvrditi katalog predmeta](./tickets/01-pristup-podacima-i-katalog.md)
- [x] **01.5** — [Osnovni testovi](./tickets/01.5-osnovni-testovi.md)
- [x] **02** — [Generisani tipovi baze umesto ručnih override-a](./tickets/02-generisani-tipovi-baze.md)
- [ ] **03** — [Slika profila: upload, prikaz i zamena](./tickets/03-slika-profila.md)
- [ ] **04** — [Javni profil drugog korisnika](./tickets/04-javni-profil-korisnika.md)
- [ ] **05** — [Pretraga i filtriranje korisnika](./tickets/05-pretraga-korisnika.md)
- [ ] **06** — [Pretraga i filtriranje grupa](./tickets/06-pretraga-grupa.md)
- [ ] **07** — [Upravljanje grupom za vlasnika](./tickets/07-upravljanje-grupom.md)
- [ ] **08** — [Privatne grupe sa odobravanjem članstva](./tickets/08-privatne-grupe.md)
- [ ] **09** — [Dorada chata: vreme, brisanje, starije poruke](./tickets/09-dorada-chata.md)
- [ ] **10** — [Prazna stanja, učitavanje i obrada grešaka](./tickets/10-prazna-stanja-i-greske.md)
- [ ] **11** — [Deploy na Vercel i produkcijska autentifikacija](./tickets/11-deploy-i-produkcija.md)

### Pokrivenost zahteva

| Tiket | Pokriva |
|---|---|
| 01 | NFR-1 (ispravka), FR-11 |
| 01.5 | NFR-1 (provera), NFR-6 |
| 02 | NFR-6 |
| 03 | FR-8 |
| 04 | FR-9, FR-10 |
| 05 | FR-17, FR-18 |
| 06 | FR-22 |
| 07 | FR-24, FR-25, FR-26 |
| 08 | FR-27 |
| 09 | FR-31, FR-32 |
| 10 | NFR-3, NFR-4, NFR-5 |
| 11 | — (isporuka) |

---

## 9. Pravila rada

1. Pročitati [tech.md](./tech.md) pre pisanja koda. Next.js 16 se razlikuje od ranijih
   verzija — `proxy.ts` umesto `middleware.ts`, asinhroni `params` i `cookies()`.
2. Pročitati [db.md](./db.md) pre dodirivanja baze. Svaka nova tabela ili kolona traži
   i RLS politiku i GRANT.
3. Raditi **jedan tiket odjednom**, redom. Ne počinjati tiket čiji blokeri nisu završeni.
4. Ne menjati postojeće migracije — dodati novu sa sledećim brojem.
5. Poštovati rečnik iz sekcije 3. Ne uvoditi nove nazive za postojeće koncepte.
6. Pre commita: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
7. Po završetku: štiklirati tiket ovde, ažurirati `tickets/NN-*.md`, i ako je dirana
   baza — ažurirati `db.md`.
