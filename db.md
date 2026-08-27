# db.md — Model podataka StudyMate

> Izvor istine za šemu baze, bezbednosne politike i funkcije.
> Svaka promena baze ide kroz **novu migraciju** u `supabase/migrations/` i **ažuriranje ovog fajla**.
> Nikad ne menjaj postojeću migraciju koja je već pokrenuta.
> Povezani dokumenti: [prd.md](./prd.md), [tech.md](./tech.md).

---

## 1. Migracije

Pokreću se redom u Supabase Dashboard → SQL Editor.

| # | Fajl | Sadržaj |
|---|---|---|
| 001 | `001_schema.sql` | Tabele, ograničenja, indeksi, trigger za profil |
| 002 | `002_rls.sql` | Row Level Security politike, helper `je_clan`, Realtime |
| 003 | `003_matching.sql` | RPC funkcije `pronadji_slicne`, `preporuci_grupe` |
| 004 | `004_seed.sql` | Početni katalog predmeta |
| 005 | `005_grants.sql` | Tabelarne privilegije za rolu `authenticated` |
| 006 | `006_avatars.sql` | Storage bucket `avatars` i politike pristupa |
| 007 | `007_avatars_rls_fix.sql` | Politike iz 006 promenjene na `to public` (međukorak istrage, vidi sekciju 8) |
| 008 | `008_javni_profil.sql` | Dodatna RLS politika: clanstva u javnim grupama vidljiva svim prijavljenima (za javni profil, tiket 04) |
| 009 | `009_pretraga_korisnika.sql` | RPC funkcija `pretrazi_korisnike` (za pretragu i filtriranje korisnika, tiket 05) |
| 010 | `010_upravljanje_grupom.sql` | Dodatna RLS politika: vlasnik grupe sme da ukloni clanstvo bilo kog drugog clana (za upravljanje grupom, tiket 07) |
| 011 | `011_privatne_grupe.sql` | Privatne grupe vidljive svima u pretrazi; INSERT politika nad `group_members` **zamenjena** da spreci zaobilazenje odobravanja; nova UPDATE politika za odobravanje zahteva (tiket 08) |
| 012 | `012_realtime_brisanje_poruka.sql` | `messages` prebacena na `REPLICA IDENTITY FULL` da bi Realtime DELETE dogadjaji nosili dovoljno kolona za RLS proveru (tiket 09) |
| 014 | `014_avatars_owner.sql` | **Popravka tiketa 03:** politike nad `storage.objects` prebačene sa `auth.uid()` na `owner_id` (u Storage kontekstu `auth.uid()` je `NULL`) + SELECT politika zbog `upsert` |
| 015 | `015_privatna_grupa_vlasnik.sql` | **Popravka tiketa 08:** INSERT politika nad `group_members` iz 011 **zamenjena** da dozvoli vlasniku da sebe upiše kao aktivnog člana i u privatnoj grupi — bez ovoga `napraviGrupu` nije mogao da upiše vlasnika u sopstvenu privatnu grupu (vidi napomenu ispod) |

Konvencija imenovanja za nove: `NNN_kratak_opis.sql`, sledeći slobodan broj.

> Broj `013` je namerno preskočen — migracija sa tim brojem je napisana tokom istrage
> problema iz sekcije 8, ali ju je `014` u potpunosti zamenila pre nego što je pokrenuta.

---

## 2. Dijagram relacija

```
auth.users (Supabase)
     │ 1:1  (trigger on_auth_user_created)
     ▼
  profiles ──────────────┐
     │ M:N               │ 1:N (owner_id)
     ▼                   ▼
user_subjects         groups ──── M:1 ──── subjects
     │ M:1                │ M:N
     ▼                    ▼
  subjects           group_members ──── M:1 ──── profiles
                          │
                       messages ──── M:1 ──── profiles
```

---

## 3. Tabele

### 3.1 `profiles`

Javni profil korisnika. **Ne postoji tabela `users`** — Supabase već ima `auth.users`,
a `profiles.id` je strani ključ ka njoj.

| Kolona | Tip | Ograničenja | Opis |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | Isti ID kao auth korisnik |
| `ime` | `text` | NOT NULL | Ime i prezime |
| `skola` | `text` | | Škola ili fakultet |
| `opis` | `text` | | Slobodan tekst „o meni" |
| `avatar_url` | `text` | | Putanja u Supabase Storage |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Trigger `on_auth_user_created`** — posle `INSERT` u `auth.users` automatski pravi red u
`profiles`. Ime uzima iz `raw_user_meta_data->>'ime'` (šalje se iz `signUp` options),
a ako ga nema, koristi deo emaila pre `@`.

Funkcija `handle_new_user()` je `SECURITY DEFINER` sa `search_path = ''` — mora biti,
jer se izvršava u kontekstu `auth` sistema koji nema pristup `public` šemi.

### 3.2 `subjects`

Katalog predmeta. Read-only iz aplikacije; popunjava se migracijom.

| Kolona | Tip | Ograničenja |
|---|---|---|
| `id` | `bigint` | PK, GENERATED ALWAYS AS IDENTITY |
| `naziv` | `text` | NOT NULL, UNIQUE |
| `kategorija` | `text` | koristi se za grupisanje u UI |

Postojeće kategorije: `Prirodne nauke`, `Informatika`, `Jezici`, `Društvene nauke`.

### 3.3 `user_subjects` (pivot)

Koje predmete korisnik uči. **Srce matchinga** — na osnovu ove tabele se računaju preporuke.

| Kolona | Tip | Ograničenja |
|---|---|---|
| `user_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE |
| `subject_id` | `bigint` | FK → `subjects(id)` ON DELETE CASCADE |
| `nivo` | `text` | NOT NULL, default `'srednji'`, CHECK IN (`pocetnik`, `srednji`, `napredni`) |

Primarni ključ: `(user_id, subject_id)` — korisnik ne može dvaput dodati isti predmet.
Indeks na `subject_id` zbog join-a u matching upitu.

### 3.4 `groups`

| Kolona | Tip | Ograničenja |
|---|---|---|
| `id` | `bigint` | PK, GENERATED ALWAYS AS IDENTITY |
| `naziv` | `text` | NOT NULL |
| `opis` | `text` | |
| `subject_id` | `bigint` | FK → `subjects(id)` ON DELETE SET NULL |
| `owner_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `max_clanova` | `int` | NOT NULL, default `10`, CHECK BETWEEN 2 AND 100 |
| `is_public` | `boolean` | NOT NULL, default `true` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

`is_public = false` znači da grupu vide samo članovi i vlasnik.

### 3.5 `group_members` (pivot)

| Kolona | Tip | Ograničenja |
|---|---|---|
| `group_id` | `bigint` | FK → `groups(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `profiles(id)` ON DELETE CASCADE |
| `uloga` | `text` | NOT NULL, default `'clan'`, CHECK IN (`vlasnik`, `clan`) |
| `status` | `text` | NOT NULL, default `'aktivan'`, CHECK IN (`na_cekanju`, `aktivan`) |
| `joined_at` | `timestamptz` | NOT NULL, default `now()` |

Primarni ključ: `(group_id, user_id)`.

`status = 'na_cekanju'` je pripremljen za privatne grupe sa odobravanjem članstva
(još nije korišćen u UI).

> **Napomena:** vlasnik grupe se ne dodaje automatski triggerom — dodaje ga
> Server Action `napraviGrupu` odmah posle `INSERT`-a u `groups`.

### 3.6 `messages`

| Kolona | Tip | Ograničenja |
|---|---|---|
| `id` | `bigint` | PK, GENERATED ALWAYS AS IDENTITY |
| `group_id` | `bigint` | NOT NULL, FK → `groups(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `tekst` | `text` | NOT NULL, CHECK dužina 1–2000 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

Indeks `(group_id, created_at desc)` za učitavanje poslednjih poruka.

Tabela je dodata u `supabase_realtime` publikaciju, pa `postgres_changes` pretplata radi.

**`REPLICA IDENTITY FULL`** (od migracije 012, tiket 09): podrazumevano Postgres šalje u
`old` delu DELETE/UPDATE payload-a samo kolone primarnog ključa (`id`). RLS politika za
SELECT proverava `group_id` (preko `je_clan`), pa bez `group_id` u `old` zapisu Realtime
ne može da proceni ko sme da vidi DELETE događaj i ne isporučuje ga nikome. `FULL`
identitet nosi sve kolone starog reda, čime brisanje poruke stiže uživo ostalim
članovima grupe (vidi `chat.tsx`).

---

## 4. Bezbednost — dva sloja

Ovo je najčešći izvor grešaka, pa pažljivo:

| Sloj | Šta kontroliše | Gde se definiše |
|---|---|---|
| **GRANT** | sme li rola uopšte da dodirne tabelu | `005_grants.sql` |
| **RLS** | koje redove sme da vidi ili menja | `002_rls.sql` |

Ako fali GRANT, PostgREST vraća `42501: permission denied for table X` **pre** nego
što RLS politike uopšte dođu na red. Ako fali RLS politika, upit prolazi ali vraća
prazan rezultat. Dva različita simptoma, dva različita uzroka.

### 4.1 Role

| Rola | Ko je to | Šta ima |
|---|---|---|
| `anon` | neprijavljen posetilac | samo `USAGE` na šemi `public` — nema pristup tabelama |
| `authenticated` | prijavljen korisnik | SELECT/INSERT/UPDATE/DELETE nad app tabelama, SELECT nad `subjects` |
| `service_role` | serverski ključ | zaobilazi RLS — **ne koristi se u ovoj aplikaciji** |

### 4.2 Helper funkcija `je_clan(g_id bigint)`

```sql
security definer, stable, search_path = ''
```

Vraća `true` ako je trenutni korisnik (`auth.uid()`) aktivan član grupe.

**Zašto `SECURITY DEFINER`:** politika nad `group_members` koja bi u sebi čitala
`group_members` izaziva `infinite recursion detected in policy`. `SECURITY DEFINER`
funkcija se izvršava sa privilegijama vlasnika i zaobilazi RLS, čime se rekurzija prekida.
Ovo je standardni Supabase obrazac.

### 4.3 Pregled politika

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | svi prijavljeni | (trigger) | samo svoj (`auth.uid() = id`) | — |
| `subjects` | svi prijavljeni | — | — | — |
| `user_subjects` | svi prijavljeni | samo sebi | — | samo sebi |
| `groups` | sve grupe, svima (od 011, tiket 08 — i privatne su vidljive po nazivu) | kao vlasnik | samo vlasnik | samo vlasnik |
| `group_members` | svoja članstva + članstva svojih grupa + članstva javnih grupa (od 008, za javni profil) | samo sebe, i to `na_cekanju` uvek ili `aktivan` samo u javnoj grupi (zamenjeno u 011, tiket 08) | vlasnik odobrava zahtev na_cekanju → aktivan (od 011, tiket 08) | samo sebe + vlasnik grupe uklanja bilo kog člana, uključujući zahteve na čekanju (od 010, tiket 07) |
| `messages` | samo u svojim grupama | samo u svojim grupama, kao ti | — | samo svoje |

Sve politike su `TO authenticated`. Neprijavljen korisnik ne vidi ništa.

**Posledice koje treba imati na umu pri pisanju upita:**

- **Od migracije 011 (tiket 08) `groups` SELECT vraća sve grupe, i privatne**, da bi
  korisnik uopšte mogao da naiđe na privatnu grupu i pošalje zahtev za članstvo. Upit
  nad `groups` za grupu koja ne postoji i dalje vraća prazno — to se i dalje tretira kao
  `notFound()`. Ono što RLS i dalje krije za nečlana privatne grupe je sadržaj: `messages`
  i (osim sopstvenog reda) `group_members`.
- Učitavanje poruka ima smisla samo ako je korisnik član; u suprotnom RLS vrati prazan niz.
- `profiles` je vidljiv svim prijavljenima jer je to javni profil. Email **nije** u
  `profiles` i ne izlaže se drugima.
- **Agregati nad `group_members` su tačni samo članovima grupe, sem za javne grupe
  (od migracije 008).** Za privatnu grupu čiji nisi član, `count(*)` vraća 0, a ne
  stvarni broj članova, jer politika dozvoljava čitanje samo sopstvenih članstava i
  članstava svojih grupa. Za javnu grupu su članstva vidljiva svima (dodato u tiketu 04
  radi prikaza javnih grupa na javnom profilu), pa je `count(*)` tačan bez obzira na
  članstvo posmatrača. `preporuci_grupe` je i dalje `security invoker` i ne koristi ovu
  politiku direktno. Nedostatak N-2 u `prd.md` ostaje za privatne grupe i za UI koji
  broj članova još ne prikazuje na osnovu ovoga; rešava se u tiketu 06.
- **Politika iz 010 ne sprečava vlasnika da obriše sopstveno članstvo** — to i dalje
  dozvoljava postojeća "napustas grupu sam" (svako sme da obriše svoj red). Pravilo
  "vlasnik ne može ukloniti samog sebe" iz tiketa 07 je zato provera u Server Action-u
  (`ukloniClana`), ne RLS politika — inherentno ne može biti RLS jer bi to sprečilo i
  legitimno napuštanje grupe od strane vlasnika (koje UI ionako ne nudi).
- **Tiket 08 — privatne grupe sa odobravanjem članstva.** INSERT politika nad
  `group_members` iz 002_rls.sql ("pridruzujes se sam") je u 011 **zamenjena**, ne
  dopunjena — dodatna permisivna politika bi se samo OR-ovala sa postojećom i ne bi
  ograničila ništa, pa je jedini način da se stvarno zabrani insert bio brisanje i
  ponovno pravljenje. Trenutna verzija (posle popravke u 015, vidi napomenu ispod)
  dozvoljava insert sopstvenog reda sa `status = 'na_cekanju'` za bilo koju grupu, ili
  sa `status = 'aktivan'` ako je ciljna grupa javna **ili** ako si vlasnik te grupe —
  sprečava zaobilaženje odobravanja direktnim insert-om mimo Server Action-a, dok i
  dalje dozvoljava vlasniku da se odmah upiše kao aktivan član sopstvene (i privatne)
  grupe. Odobravanje (`na_cekanju` → `aktivan`) je nova UPDATE politika, ograničena na
  vlasnika grupe i na redove koji su trenutno `na_cekanju`. Odbijanje zahteva ne treba
  novu politiku jer postojeća DELETE politika iz 010 već dozvoljava vlasniku da obriše
  bilo koje članstvo svoje grupe, bez obzira na status. Provera da odobravanje ne bi
  premašilo `max_clanova` je u Server Action-u (`odobriZahtev`), isti razlog kao kod
  `izmeniGrupu` u tiketu 07 — zavisi od trenutnog broja aktivnih članova u trenutku
  izvršavanja, ne može biti CHECK ograničenje. Zahtevi na čekanju se ne broje u
  popunjenost jer se svuda eksplicitno filtrira `status = 'aktivan'`. Vlasnik vidi tuđe
  zahteve na čekanju bez ikakve nove SELECT politike — postojeća "vidis clanstva svojih
  grupa" već dozvoljava čitanje svih redova grupe čiji si aktivan član (`je_clan`), a
  vlasnik je uvek aktivan član sopstvene grupe.
- **Bag otkriven posle tiketa 08, popravljen u 015: vlasnik privatne grupe ostajao bez
  sopstvenog članstva.** Prvobitna INSERT politika iz 011 je dozvoljavala
  `status = 'aktivan'` samo za javnu grupu — ali `napraviGrupu` (Server Action) odmah
  posle pravljenja grupe upisuje vlasnika kao aktivnog člana, pa je taj upis za
  privatnu grupu bio odbijen. Greška nije bila proverena (`await ... insert(...)` bez
  `if (error)`), pa je akcija tiho nastavljala na `redirect` i ostavljala vlasnika bez
  reda u `group_members` — `je_clan()` je za njega vraćao `false` u sopstvenoj grupi, pa
  nije video članove, zahteve na čekanju ni chat. Migracija 015 dodaje
  `g.owner_id = auth.uid()` kao dodatni uslov (uz `auth.uid() = user_id`, pa važi samo
  za vlasnika nad sopstvenom grupom), a `napraviGrupu` sada proverava grešku tog upisa
  umesto da je ignoriše.

---

## 5. RPC funkcije

Pozivaju se iz aplikacije preko `supabase.rpc(...)`. Obe su `SECURITY INVOKER`,
pa se RLS primenjuje normalno.

### 5.1 `pronadji_slicne(limit_n int default 20)`

Rangira druge korisnike po broju predmeta koje uče zajedno sa trenutnim korisnikom.

**Vraća:** `id, ime, skola, opis, avatar_url, zajednicki (bigint), predmeti (text[])`

**Logika:** self-join `user_subjects` sa samom sobom preko `subject_id`, isključujući
samog korisnika, grupisano po profilu, sortirano po broju zajedničkih predmeta opadajuće.

```ts
const { data } = await supabase.rpc('pronadji_slicne', { limit_n: 10 })
```

### 5.2 `preporuci_grupe(limit_n int default 20)`

Javne grupe iz predmeta koje korisnik uči, u kojima još nije član i koje nisu popunjene.

**Vraća:** `id, naziv, opis, predmet, broj_clanova (bigint), max_clanova (int)`

```ts
const { data } = await supabase.rpc('preporuci_grupe', { limit_n: 10 })
```

### 5.3 `pretrazi_korisnike(pretraga text default null, p_subject_id bigint default null, p_nivo text default null)`

Za razliku od `pronadji_slicne`, vraća **sve** korisnike (osim pozivaoca), ne samo one sa
bar jednim zajedničkim predmetom — koristi se za stranicu pretrage (tiket 05), gde
korisnik može tražiti bilo koga po imenu ili predmetu, bez ograničenja na preklapanje.

**Vraća:** `id, ime, skola, opis, avatar_url, zajednicki (bigint), predmeti (text[])` —
`predmeti` je spisak predmeta zajedničkih sa pozivaocem (isto značenje kao u
`pronadji_slicne`), ne svi predmeti tog korisnika.

**Logika:** `pretraga` filtrira po `ime ilike '%...%'` (bez razlike velikih/malih slova).
`p_subject_id` filtrira samo korisnike koji uče taj predmet; `p_nivo` se primenjuje
isključivo u kombinaciji sa `p_subject_id` (nivo tog korisnika baš za taj predmet).
`zajednicki`/`predmeti` se računaju istim self-join obrascem kao u `pronadji_slicne`.

```ts
const { data } = await supabase.rpc('pretrazi_korisnike', {
  pretraga: 'ana',
  p_subject_id: 3,
  p_nivo: 'srednji',
})
```

> Pri dodavanju nove RPC funkcije obavezno dodaj i
> `grant execute on function public.<ime>(<tipovi>) to authenticated;`

---

## 6. Podešavanja Supabase projekta

Ovo se ne vidi u migracijama, ali je deo konfiguracije:

| Podešavanje | Vrednost | Gde |
|---|---|---|
| Confirm email | **isključeno** za razvoj | Authentication → Sign In / Providers → Email |
| Realtime | uključen za `public.messages` | postavlja `002_rls.sql` |
| Project URL | u `.env.local` kao `NEXT_PUBLIC_SUPABASE_URL` | Settings → API |
| Anon/publishable ključ | u `.env.local` kao `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API |

`NEXT_PUBLIC_SUPABASE_URL` mora biti oblika `https://<ref>.supabase.co`.
Ubacivanje ključa u to polje je česta greška i ruši svaki poziv.

---

## 7. Provera zdravlja baze

Pokreni u SQL Editoru posle svake serije migracija:

```sql
-- Ima li predmeta?
select count(*) from public.subjects;                    -- očekivano: 15

-- Da li je RLS uključen na svim tabelama?
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;          -- sve mora biti true

-- Koje politike postoje?
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' order by tablename;

-- Ima li rola authenticated privilegije?
select table_name, privilege_type from information_schema.role_table_grants
where grantee = 'authenticated' and table_schema = 'public'
order by table_name;
```

---

## 8. Storage — bucket `avatars`

Definisan u `006_avatars.sql`.

| Podešavanje | Vrednost |
|---|---|
| `public` | `true` — čitanje ide preko javnog URL-a, bez RLS provere |
| `file_size_limit` | `5242880` (5MB), prati `MAX_VELICINA_SLIKE` u `src/lib/validacija.ts` |
| `allowed_mime_types` | `image/png`, `image/jpeg`, `image/webp`, `image/gif` |

**Konvencija putanje:** svaki fajl se čuva kao `<user_id>/avatar` — bez ekstenzije,
uvek isto ime. Otpremanje nove slike koristi `upsert: true` i prepisuje stari fajl na
istoj putanji, pa se stare slike ne gomilaju u skladištu. `avatar_url` u `profiles` je
javni URL sa `?v=<timestamp>` dodatkom radi trenutnog osvežavanja prikaza posle zamene.

**Politike nad `storage.objects`** (`to public`, SELECT/INSERT/UPDATE/DELETE, konačan
oblik u `014_avatars_owner.sql`):

```sql
bucket_id = 'avatars' and (storage.foldername(name))[1] = owner_id::text
```

Korisnik sme da dira isključivo fajlove u sopstvenom folderu (`<svoj_user_id>/...`),
dakle može postaviti sliku samo na svoj profil. SELECT politika je potrebna zbog
`upsert: true` — zamena slike ide kroz UPDATE granu, pa servis prvo mora da pronađe
postojeći red. Javno čitanje avatara ne ide kroz RLS (bucket je `public = true`), pa
SELECT politika ne utiče na to da li korisnici vide tuđe slike.

**Tok postavljanja:** `avatar-upload.tsx` (Client Component) šalje fajl kroz Server
Action `sacuvajAvatar()` (`profil/actions.ts`) koji otprema u Storage i upisuje javni URL
u `profiles.avatar_url`. Putanja `<user_id>/avatar` se gradi iz `getUser()`, nikad iz
ulaza klijenta. Zbog veličine slika (do 5MB) `bodySizeLimit` za Server Actions je podignut
u `next.config.ts`.

### ⚠️ `auth.uid()` NE radi u politikama nad `storage.objects`

Ovo je najvažnija stvar koju treba znati pre pisanja bilo koje nove Storage politike
u ovom projektu, i uzrok dugotrajne greške pri implementaciji tiketa 03.

**Simptom:** svako otpremanje pada sa `StorageApiError: new row violates row-level
security policy` (HTTP 400, `statusCode: '403'`, `code: AccessDenied`), iako je politika
naizgled tačna.

**Uzrok:** unutar zahteva koji dolazi kroz Storage API, `auth.uid()` vraća `NULL` — Storage
servis ovog projekta ne prosleđuje `request.jwt.claims` u SQL kontekst. Zbog toga uslov
`... = auth.uid()::text` nikad nije tačan i politika uvek odbija upis.

Ovo **nije** greška u aplikaciji i ne zavisi od toga odakle se poziva. Isključeno je
redom, merenjem a ne nagađanjem:

| Provereno | Nalaz |
|---|---|
| Validnost JWT-a (`sub`, `role`, `aud` ispisani na serveru) | ispravan, `role: authenticated`, `sub` = ID korisnika |
| Isti token kroz PostgREST (`update` nad `profiles`) | radi, HTTP 200 |
| Isti `insert` direktno u SQL Editoru uz `set local role authenticated` + `request.jwt.claims` | prolazi |
| Otpremanje iz browsera / iz Server Action-a / uz ručno postavljen `Authorization` header | svi padaju isto |
| Politike `to authenticated` → `to public` | bez promene (isključuje rolu kao uzrok) |
| Restart Supabase projekta | bez promene |
| Dodatni okidači na `storage.objects` | samo standardni `protect_objects_delete`, `update_objects_updated_at` |
| `storage.prefixes` (sumnja na noviji Storage) | tabela ne postoji u ovoj verziji |
| Politika **bez** `auth.uid()` provere (`with check (bucket_id = 'avatars')`) | **otpremanje odmah prolazi** — dokaz da je uzrok baš `auth.uid()` |

**Rešenje:** koristiti `owner_id` umesto `auth.uid()`. Tu kolonu popunjava sam Storage
servis iz tokena i klijent na nju ne može da utiče — provereno da sadrži tačan ID
korisnika koji je otpremio fajl:

```
name:     b393bb8f-…-df5f3b82e530/avatar
owner_id: b393bb8f-…-df5f3b82e530
```

Uslov `(storage.foldername(name))[1] = owner_id::text` traži da se **folder poklapa sa
vlasnikom reda**, čime se dobija ista garancija kao sa `auth.uid()` — korisnik piše samo
u svoj folder — bez oslanjanja na claim-ove kojih u Storage kontekstu nema.

> Zaostavština istrage: `007_avatars_rls_fix.sql` (prelazak na `to public`) je bio
> pokušaj popravke koji nije bio uzrok, ali je zadržan jer je bezopasan i `014` gradi
> na njemu. Prava popravka je `014_avatars_owner.sql`.

---

## 9. Buduće promene (nisu implementirane)

- Kolona `messages.izmenjeno_at` za izmenu poruka
- Tabela `group_invites` za pozivnice u privatne grupe
- Generisani TypeScript tipovi (`supabase gen types typescript`) — uklanjaju potrebu
  za `.overrideTypes()` u kodu
