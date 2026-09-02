# tech.md — Tehnička specifikacija StudyMate

> Ovaj dokument je izvor istine za tehnološke odluke i konvencije.
> Obavezno pročitati pre rada na bilo kom tiketu.
> Povezani dokumenti: [prd.md](./prd.md) (šta gradimo).

---

## 1. Stack

| Sloj | Tehnologija | Verzija | Napomena |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.3.3 | Turbopack je podrazumevani bundler |
| UI biblioteka | React | 19.2.8 | Server Components po defaultu |
| Jezik | TypeScript | ^5 | `strict: true` |
| Stilizacija | Tailwind CSS | ^4 | preko `@tailwindcss/postcss` |
| Baza / Auth / Realtime | Supabase (PostgreSQL) | — | hostovano |
| Supabase klijent | `@supabase/supabase-js` | ^2.112 | |
| SSR integracija | `@supabase/ssr` | ^0.12 | **ne** koristiti `auth-helpers-nextjs` |
| Linting | ESLint | ^9 | flat config |
| Runtime | Node.js | >= 20.9 | Next 16 ne podržava Node 18 |

Menadžer paketa: **npm**. Lockfile `package-lock.json` se commit-uje.

### Komande

```bash
npm run dev      # dev server (Turbopack), http://localhost:3000
npm run build    # produkcijski build
npm run start    # pokretanje produkcijskog build-a
npm run lint     # eslint
npx tsc --noEmit # provera tipova bez emitovanja
npx next typegen # regeneracija tipova ruta (posle brisanja .next)
npm run gen:types # regeneracija tipova baze iz Supabase seme (vidi sekciju 4.4)
npm test         # jedinicni testovi + testovi pravila pristupa (Vitest)
npm run test:e2e # end-to-end test (Playwright) - vidi sekciju 9
```

---

## 2. Next.js 16 — obavezno pročitati

Ova verzija ima breaking changes u odnosu na većinu tutorijala i na trening podatke
većine modela. Kod pisan po Next 15 obrascima **neće raditi**.

### 2.1 `middleware.ts` → `proxy.ts`

Fajl se zove `proxy.ts`, izvezena funkcija se zove `proxy`.

```ts
// src/proxy.ts
export async function proxy(request: NextRequest) { ... }
```

- Runtime je uvek `nodejs` i **ne može** se konfigurisati.
- `edge` runtime nije podržan u `proxy`.
- Config flagovi su preimenovani: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.

### 2.2 Asinhroni Request APIji

`cookies()`, `headers()`, `draftMode()`, `params` i `searchParams` su **isključivo
asinhroni**. Sinhroni pristup je uklonjen.

```ts
const cookieStore = await cookies()          // OK
const { id } = await params                  // OK
export default async function Page({ params }: { params: Promise<{ id: string }> })
```

Zbog toga je i `createClient()` iz `lib/supabase/server.ts` **async funkcija**.
Uvek se poziva sa `await`.

### 2.3 Ostalo

- Turbopack je default — `--turbopack` flag više nije potreban.
- `next lint` je uklonjen; koristi se `eslint` direktno.
- `revalidateTag(tag)` traži drugi argument: `revalidateTag(tag, 'max')`.
  Za read-your-writes semantiku koristiti `updateTag(tag)` u Server Actionu.
- Paralelne rute traže eksplicitan `default.js` u svakom slotu.
- Tipovi ruta se generišu u `.next/types`. Ako obrišeš `.next`, pokreni `npx next typegen`
  pre `tsc --noEmit`, inače `LayoutProps` / `PageProps` neće postojati.

---

## 3. Struktura projekta

```
studymate/
  prd.md                        Proizvodni zahtevi + lista tiketa
  tech.md                       Ovaj fajl
  supabase/migrations/          SQL migracije (redosled je bitan)
  src/
    proxy.ts                    Next 16 proxy — sesija + zaštita ruta
    lib/
      auth-greske.ts            Prevod Supabase auth kodova u poruke na srpskom
      validacija.ts             Cista validacija unosa (testirano u tests/unit/)
      rangiranje.ts             Cista logika rangiranja preporuka (testirano u tests/unit/)
    lib/supabase/
      client.ts                 Browser klijent (Client Components)
      server.ts                 Server klijent (RSC, Actions, Route Handlers)
      proxy.ts                  Klijent za proxy sloj (updateSession)
    app/
      page.tsx                  Landing (javna)
      login/                    page.tsx + actions.ts (login/register/logout)
      register/page.tsx
      auth/confirm/route.ts     Potvrda email adrese
      (app)/                    Route grupa — sve zahteva prijavu
        layout.tsx              Auth provera + navigacija
        dashboard/
        predmeti/
        profil/
        grupe/
          page.tsx, actions.ts, nova-grupa.tsx
          [id]/page.tsx, chat.tsx
  tests/
    unit/                        Cista logika (validacija.ts, rangiranje.ts)
    rls/                         Testovi RLS politika nad pravom bazom
    e2e/                         Playwright test glavnog toka
    helpers/                     Zajednicki test kod (env, admin klijent, registracija)
  .env.local                    NIJE u gitu
```

### Pravila strukture

- Sve autentifikovane strane idu u route grupu `(app)`. Grupa ne utiče na URL.
- Server Actions se drže u `actions.ts` pored strane koja ih koristi.
- Client Components se izdvajaju u zaseban fajl (npr. `form.tsx`, `chat.tsx`),
  a strana ostaje Server Component. **Nikad** ne stavljaj `'use client'` na `page.tsx`
  koji čita podatke.
- Import alias je `@/*` → `src/*`.

---

## 4. Supabase — obrasci korišćenja

### 4.1 Koji klijent gde

| Kontekst | Import | Poziv |
|---|---|---|
| Server Component, Server Action, Route Handler | `@/lib/supabase/server` | `const supabase = await createClient()` |
| Client Component (`'use client'`) | `@/lib/supabase/client` | `const supabase = createClient()` |
| `proxy.ts` | `@/lib/supabase/proxy` | `updateSession(request)` |

### 4.2 Autentifikacija

- Za proveru korisnika na serveru **uvek** `supabase.auth.getUser()`, nikad `getSession()`.
  `getUser()` verifikuje token kod Supabasea; `getSession()` čita kolačić kome se ne veruje.
- U `updateSession()` ne sme biti **ničega** između `createServerClient()` i `getUser()`,
  niti se sme preskočiti vraćanje `supabaseResponse` — inače se kolačići sesije gube
  i korisnik biva nasumično izlogovan.
- Zaštita ruta radi na dva mesta: `proxy.ts` (redirect) i `(app)/layout.tsx` (provera).
  Oba su namerna — proxy je brz, layout je garancija.

### 4.3 Mutacije

Sve promene stanja idu kroz **Server Actions**, ne kroz API rute.

```ts
'use server'
export async function nesto(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // ... mutacija
  revalidatePath('/putanja')
}
```

Izuzetak: slanje i brisanje chat poruka idu direktno iz Client Componenta preko browser
klijenta, jer Realtime pretplata ionako radi u browseru i tako se izbegava dupli
round-trip; RLS politike ("pises poruke u svojim grupama", "brises svoje poruke") su i
dalje jedina prava zastita, ne komponenta.

Za forme sa povratnom porukom koristi `useActionState`:

```ts
const [state, formAction, pending] = useActionState(akcija, null)
// akcija: (_prev: unknown, formData: FormData) => Promise<{ greska?: string; poruka?: string }>
```

### 4.4 Generisani tipovi baze

Tipovi se generišu direktno iz Supabase šeme i žive u
[`src/lib/supabase/database.types.ts`](./src/lib/supabase/database.types.ts) (commit-ovan fajl,
ne piše se ručno). Sva tri klijenta (`lib/supabase/client.ts`, `server.ts`, `proxy.ts`) su
parametrizovana sa `Database` tipom — `createBrowserClient<Database>(...)`,
`createServerClient<Database>(...)`.

Regeneracija posle izmene migracije:

```bash
npx supabase login          # jednom po masini, otvara browser za autentifikaciju
npm run gen:types           # supabase gen types typescript --project-id ... > database.types.ts
```

Zahvaljujući generisanim tipovima, `supabase-js` sam zna da li je embedovana relacija objekat
ili niz na osnovu foreign key-a u šemi (many-to-one → objekat, one-to-many → niz) — `.overrideTypes<>()`
više nije potreban i ne sme se koristiti.

Isto važi za RPC pozive: `supabase.rpc('pronadji_slicne', ...)` vraća tip direktno iz
`Database['public']['Functions']`, bez ručnog kastovanja (`as`) rezultata.

---

## 5. Bezbednost

1. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` je javan.** Vidljiv je u browseru svakome.
   Sva bezbednost je u bazi — RLS politikama i GRANTovima.
2. **Nikad ne koristi `service_role` ključ u ovoj aplikaciji.** On zaobilazi RLS.
   Ako zatreba, ide isključivo u serverski kod i nikad u promenljivu sa `NEXT_PUBLIC_` prefiksom.
3. **Ne veruj `user_id` iz forme.** Uvek ga uzmi iz `getUser()` na serveru.
   RLS politike su druga linija odbrane, ne prva.
4. `.env.local` je u `.gitignore` i tu ostaje.

---

## 6. Konvencije koda

- **Jezik u kodu:** imena promenljivih, funkcija, ruta i kolona su na srpskom bez dijakritike
  (`predmeti`, `pridruziSe`, `brojClanova`). Ključne reči i APIji ostaju engleski.
  Komentari u kodu su bez dijakritike; dokumentacija (`.md`) sa dijakritikom.
- **Poruke korisniku** su na srpskom.
- Bez `any`. Ako tip nije poznat, `unknown` pa suzi.
- Bez `useEffect` za dohvatanje podataka — podaci se čitaju u Server Componentima.
  `useEffect` je dozvoljen samo za pretplate (Realtime) i DOM efekte.
- Tailwind klase inline; bez zasebnih CSS fajlova osim `globals.css`.
- Svaki novi upit prema bazi mora imati odgovarajuću RLS politiku — ako je nema,
  dodaj migraciju, ne zaobilazi RLS.

---

## 7. Definition of Done za svaki tiket

Tiket nije završen dok sve ovo ne prolazi:

- [ ] `npx tsc --noEmit` — bez grešaka
- [ ] `npm run lint` — bez grešaka
- [ ] `npm run build` — prolazi
- [ ] `npm test` — prolazi (jedinični testovi + testovi pravila pristupa)
- [ ] Ako je tiket dirao glavni tok (prijava, predmeti, grupe, chat): `npm run test:e2e` prolazi
- [ ] Funkcionalnost ručno proverena u `npm run dev`
- [ ] Ako je dirana baza: nova migracija u `supabase/migrations/`
- [ ] Ako je dirana logika validacije ili rangiranja: dodati/ažurirati testovi u `tests/unit/`
- [ ] Kvačica u `prd.md` uz odgovarajući tiket
- [ ] Commit sa jasnom porukom na srpskom

---

## 8. Testiranje

Tri nivoa, svaki u svom direktorijumu i sa svojom svrhom:

| Nivo | Direktorijum | Alat | Pokreće se sa |
|---|---|---|---|
| Jedinični | `tests/unit/` | Vitest | `npm test` |
| Pravila pristupa (RLS) | `tests/rls/` | Vitest + `@supabase/supabase-js` | `npm test` |
| End-to-end | `tests/e2e/` | Playwright | `npm run test:e2e` |

### 8.1 Jedinični testovi

Čista logika bez baze i bez mreže. Živi u `src/lib/`:

- `src/lib/validacija.ts` — pravila koja prate postojeća ograničenja u bazi
  (`max_clanova` 2–100, `tekst` poruke 1–2000 karaktera, lozinka min. 6 karaktera, naziv grupe
  obavezan). Ne izmišljati nova pravila ovde — samo ona koja već postoje kao CHECK u
  `001_schema.sql` ili kao HTML atribut na formi.
- `src/lib/rangiranje.ts` — isti redosled kao RPC funkcije `pronadji_slicne` i
  `preporuci_grupe` iz `003_matching.sql`. Ako se promeni `ORDER BY` u SQL-u, promeni i
  ovde (i obrnuto) — test će uhvatiti neslaganje.

### 8.2 Testovi pravila pristupa

Rade nad **pravom** Supabase bazom iz `.env.local` — RLS je funkcija baze i ne može se
verodostojno testirati bez nje. Svaki test pravi sopstvene test korisnike preko
`supabase.auth.signUp` (isto što radi i registraciona forma), pa proverava šta jedan
korisnik sme da vidi/menja kod drugog.

**Dodatni env. promenljiva, samo za testove** (nikad se ne koristi u `src/`):

```
SUPABASE_SERVICE_ROLE_KEY=...   # Project Settings -> API -> service_role
```

Koristi se isključivo u `tests/helpers/admin.ts` da obriše test korisnike posle testa.
Zahvaljujući `on delete cascade` lancu u šemi, brisanje `auth.users` reda automatski
povlači i profil, predmete, grupe, članstva i poruke tog korisnika — nema ručnog čišćenja
tabela, testovi ne ostavljaju smeće.

**Preduslov:** *Confirm email* mora biti isključen u tom Supabase projektu (isto
podešavanje koje je već potrebno za razvoj) — inače `signUp` ne vraća odmah aktivnu
sesiju i test korisnik ne može ništa da uradi.

### 8.3 End-to-end test

`tests/e2e/glavni-tok.spec.ts` pokriva ceo tok: registracija → izbor predmeta →
kreiranje grupe → slanje poruke → odjava. Playwright sam pokreće `npm run dev` i čeka
`http://localhost:3000` (vidi `playwright.config.ts`), pa ne treba ručno paliti server.
Test pravi jednog test korisnika sa jedinstvenim emailom i briše ga na kraju preko istog
`tests/helpers/admin.ts`.

Pre prvog pokretanja treba instalirati Chromium za Playwright:

```bash
npx playwright install chromium
```

---

## 9. Poznate zamke

| Simptom | Uzrok | Rešenje |
|---|---|---|
| `42501: permission denied for table X` | Nedostaje `GRANT` roli `authenticated` | Dodati GRANT u migraciju (vidi `005_grants.sql`) |
| Prazna lista iako podaci postoje | RLS politika ne pokriva slučaj | Proveriti politiku za tu tabelu |
| `infinite recursion detected in policy` | Politika nad tabelom čita istu tabelu | Koristiti `security definer` helper (`je_clan`) |
| Korisnik se nasumično izloguje | Prekinut lanac kolačića u `updateSession` | Vratiti `supabaseResponse`, ne praviti novi |
| Registracija ne uloguje korisnika | Uključena potvrda emaila | Isključiti u Auth → Providers → Email (za razvoj) |
| `Cannot find name 'LayoutProps'` | Obrisan `.next` | `npx next typegen` |
| `params.id` je `undefined` | Next 16 — `params` je Promise | `const { id } = await params` |
| Realtime `postgres_changes` javlja `"invalid column for filter <kolona>"` | Kolona iz `filter:` nema **samostalan** indeks (biti deo složenog indeksa, npr. `(group_id, created_at)`, ne računa se) | Ili dodati samostalan indeks na tu kolonu, ili (kao u `chat.tsx`) izbaciti `filter` i filtrirati u callback-u — RLS već ograničava koje redove korisnik prima |
| Realtime DELETE/UPDATE događaj ne stiže nikome | `old` deo payload-a nosi samo kolone `REPLICA IDENTITY` (podrazumevano samo primarni ključ), pa Realtime ne može da izračuna RLS politiku koja zavisi od drugih kolona (npr. `group_id`) i tiho ne isporučuje događaj | `alter table ... replica identity full;` (vidi `012_realtime_brisanje_poruka.sql`) |
| Otpremanje u Storage pada sa `new row violates row-level security policy` (HTTP 400, `statusCode: '403'`) iako je korisnik prijavljen i politika izgleda tačno | **`auth.uid()` vraća `NULL` unutar Storage zahteva** — Storage servis ne prosleđuje `request.jwt.claims` u SQL kontekst (za razliku od PostgREST-a, gde isti token radi normalno) | U politikama nad `storage.objects` koristiti `owner_id` umesto `auth.uid()`, npr. `(storage.foldername(name))[1] = owner_id::text` (vidi `014_avatars_owner.sql`) |
