# tech.md — Tehnička specifikacija StudyMate

> Ovaj dokument je izvor istine za tehnološke odluke i konvencije.
> Obavezno pročitati pre rada na bilo kom tiketu.
> Povezani dokumenti: [prd.md](./prd.md) (šta gradimo), [db.md](./db.md) (baza).

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
  db.md                         Šema baze, RLS, funkcije
  tech.md                       Ovaj fajl
  tickets/                      Opis svakog tiketa sa kriterijumima prihvatanja
  supabase/migrations/          SQL migracije (redosled je bitan)
  src/
    proxy.ts                    Next 16 proxy — sesija + zaštita ruta
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

Izuzetak: slanje chat poruka ide direktno iz Client Componenta preko browser klijenta,
jer Realtime pretplata ionako radi u browseru i tako se izbegava dupli round-trip.

Za forme sa povratnom porukom koristi `useActionState`:

```ts
const [state, formAction, pending] = useActionState(akcija, null)
// akcija: (_prev: unknown, formData: FormData) => Promise<{ greska?: string; poruka?: string }>
```

### 4.4 Tipovi embedovanih relacija

Bez generisanih tipova baze, `supabase-js` pretpostavlja da je svaka embedovana relacija
**niz**, iako many-to-one veza vraća objekat. Rešava se sa `.overrideTypes<>()`:

```ts
const { data } = await supabase
  .from('groups')
  .select('id, naziv, subjects(naziv)')
  .overrideTypes<{ subjects: { naziv: string } | null }[]>()
```

Za `.single()` override je objekat, ne niz.

> Ako se kasnije uvedu generisani tipovi (`supabase gen types typescript`),
> ovi overrideovi se brišu. Do tada su obavezni — bez njih `tsc` puca.

---

## 5. Bezbednost

1. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` je javan.** Vidljiv je u browseru svakome.
   Sva bezbednost je u bazi — RLS politikama i GRANTovima. Videti [db.md](./db.md).
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
- [ ] Funkcionalnost ručno proverena u `npm run dev`
- [ ] Ako je dirana baza: nova migracija u `supabase/migrations/` i ažuriran `db.md`
- [ ] Kvačica u `prd.md` uz odgovarajući tiket
- [ ] Commit sa jasnom porukom na srpskom

---

## 8. Poznate zamke

| Simptom | Uzrok | Rešenje |
|---|---|---|
| `42501: permission denied for table X` | Nedostaje `GRANT` roli `authenticated` | Dodati GRANT u migraciju (vidi `005_grants.sql`) |
| Prazna lista iako podaci postoje | RLS politika ne pokriva slučaj | Proveriti politiku za tu tabelu |
| `infinite recursion detected in policy` | Politika nad tabelom čita istu tabelu | Koristiti `security definer` helper (`je_clan`) |
| Korisnik se nasumično izloguje | Prekinut lanac kolačića u `updateSession` | Vratiti `supabaseResponse`, ne praviti novi |
| Registracija ne uloguje korisnika | Uključena potvrda emaila | Isključiti u Auth → Providers → Email (za razvoj) |
| `Cannot find name 'LayoutProps'` | Obrisan `.next` | `npx next typegen` |
| `params.id` je `undefined` | Next 16 — `params` je Promise | `const { id } = await params` |
