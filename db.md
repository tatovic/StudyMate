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
| 007 | `007_avatars_rls_fix.sql` | Politike iz 006 promenjene na `to public` (pokusaj popravke, vidi sekciju 8 — jos ne radi) |
| 008 | `008_javni_profil.sql` | Dodatna RLS politika: clanstva u javnim grupama vidljiva svim prijavljenima (za javni profil, tiket 04) |

Konvencija imenovanja za nove: `NNN_kratak_opis.sql`, sledeći slobodan broj.

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
| `groups` | javne + svoje + gde si član | kao vlasnik | samo vlasnik | samo vlasnik |
| `group_members` | svoja članstva + članstva svojih grupa + članstva javnih grupa (od 008, za javni profil) | samo sebe | — | samo sebe |
| `messages` | samo u svojim grupama | samo u svojim grupama, kao ti | — | samo svoje |

Sve politike su `TO authenticated`. Neprijavljen korisnik ne vidi ništa.

**Posledice koje treba imati na umu pri pisanju upita:**

- Upit nad `groups` za privatnu grupu čiji nisi član vraća prazno — u kodu se to
  tretira kao `notFound()`, ne kao greška.
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

**Politike nad `storage.objects`** (`to public` posle `007_avatars_rls_fix.sql`,
INSERT/UPDATE/DELETE): `bucket_id = 'avatars' and (storage.foldername(name))[1] =
auth.uid()::text` — korisnik sme da menja isključivo fajlove u sopstvenom folderu
(`<svoj_user_id>/...`), što znači da može postaviti sliku samo na svoj profil.
`to public` umesto `to authenticated` je bio pokušaj popravke (vidi ⚠️ ispod) — sam
uslov ostaje bezbedan jer je `auth.uid()` `NULL` za neprijavljen zahtev, pa provera
nikad nije tačna za nekoga ko nije ulogovan. Posebna SELECT politika nije potrebna jer
je bucket javan.

**Tok postavljanja:** `avatar-upload.tsx` (Client Component) šalje fajl kroz Server
Action `sacuvajAvatar()` (`profil/actions.ts`) koji otprema u Storage i upisuje javni URL
u `profiles.avatar_url`. Putanja `<user_id>/avatar` se gradi iz `getUser()`, nikad iz
ulaza klijenta. Zbog veličine slika (do 5MB) `bodySizeLimit` za Server Actions je podignut
u `next.config.ts`.

### ⚠️ Poznat problem — otpremanje trenutno ne radi (27.08.2026)

Svaki pokušaj otpremanja pada sa `StorageApiError: new row violates row-level security
policy` (status 400, `statusCode: '403'`), iako je sve provereno ispravno:

- JWT je validan, `auth.uid()` se poklapa sa putanjom fajla (potvrđeno ispisom claim-ova
  na serveru: `sub`, `role: authenticated`, `aud: authenticated` su tačni).
- Identičan `insert into storage.objects (...)` **direktno u SQL Editoru**, sa
  `set local role authenticated` i istim `request.jwt.claims`, **prolazi bez greške**
  (i sa i bez eksplicitnog `owner`).
- Ne postoje dodatni okidači (triggeri) koji bi mogli da smetaju — samo
  `protect_objects_delete` i `update_objects_updated_at`, oba standardna i nepovezana.
- Isprobano bez uspeha: otpremanje direktno iz browser klijenta; otpremanje kroz Server
  Action (server-side klijent, ista sesija koja radi za sve ostale upite); restart
  Supabase projekta; promena politika sa `to authenticated` na `to public`.

Zaključak: problem je specifičan za Storage servis ovog projekta (razlikuje se od
ponašanja PostgREST-a za iste kredencijale), verovatno na nivou kako Storage API
prosleđuje JWT/rolu ka Postgres-u. Sledeći koraci kad se nastavi:

1. Ukloniti `auth.uid()` proveru iz politike **privremeno** (samo `bucket_id = 'avatars'`)
   da se potvrdi da je baš ta provera uzrok, ne nešto drugo (mime tip, `file_size_limit`
   i sl.) — **vratiti punu proveru odmah posle testa**, ovo NIJE bezbedno stanje za trajno
   ostavljanje.
2. Ako se time potvrdi da je uzrok `auth.uid()`, proveriti Supabase Storage logove
   (Dashboard → Logs → Storage Logs) za stvarnu grešku sa servera u trenutku zahteva.
3. Ako ni to ne razjasni, kontaktirati Supabase support — moguće je da je u pitanju
   projekat-specifična infrastrukturna greška koja se ne može rešiti iz aplikacije/SQL-a.

---

## 9. Buduće promene (nisu implementirane)

- Kolona `messages.izmenjeno_at` za izmenu poruka
- Tabela `group_invites` za pozivnice u privatne grupe
- Generisani TypeScript tipovi (`supabase gen types typescript`) — uklanjaju potrebu
  za `.overrideTypes()` u kodu
