# StudyMate

Platforma za povezivanje učenika i studenata koji žele zajedno da uče i pripremaju se
za određene predmete.

**Stack:** Next.js 16.3.3 (App Router) · React 19.2 · TypeScript · Tailwind 4 ·
Supabase (Postgres + Auth + Realtime)

---

## Dokumentacija

| Fajl | Sadržaj |
|---|---|
| [prd.md](./prd.md) | Šta gradimo: zahtevi, rečnik pojmova, **lista tiketa sa napretkom** |
| [db.md](./db.md) | Model podataka: tabele, RLS politike, GRANT-ovi, RPC funkcije |
| [tech.md](./tech.md) | Tehnološke odluke, konvencije koda, Next.js 16 specifičnosti |
| [tickets/](./tickets/) | Po jedan fajl za svaki tiket, hronološkim redom |

> Redosled čitanja pre rada na kodu: `prd.md` → `tech.md` → `db.md`.
> Zatim se uzima prvi neštikliran tiket iz sekcije 8 u `prd.md`.

---

## Pokretanje

### 1. Supabase projekat

1. Napravite besplatan projekat na [supabase.com](https://supabase.com)
2. U **SQL Editor** pokrenite redom fajlove iz `supabase/migrations/`:
   `001_schema.sql` → `002_rls.sql` → `003_matching.sql` → `004_seed.sql` → `005_grants.sql`
3. U **Authentication → Sign In / Providers → Email** isključite *Confirm email*
   (samo za razvoj; u produkciji ostaje uključeno — vidi tiket 11)

### 2. Promenljive okruženja

Kopirajte `.env.local.example` u `.env.local` i popunite vrednostima iz
**Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon ili publishable ključ>
```

`NEXT_PUBLIC_SUPABASE_URL` je **Project URL**, ne ključ. Zamena ova dva polja
je česta greška i ruši svaki poziv ka bazi.

### 3. Instalacija i pokretanje

```bash
npm install
npm run dev
```

Aplikacija radi na `http://localhost:3000`.

---

## Rute

| Ruta | Opis |
|---|---|
| `/` | Landing; prijavljene preusmerava na `/dashboard` |
| `/login`, `/register` | Prijava i registracija |
| `/dashboard` | Slični korisnici i preporučene grupe |
| `/predmeti` | Izbor predmeta i nivoa znanja |
| `/profil` | Izmena profila |
| `/grupe` | Lista grupa, kreiranje, pridruživanje |
| `/grupe/[id]` | Detalji grupe, članovi, Realtime chat |

---

## Deploy na Vercel

**Javni URL:** _(popuniti posle prvog deploya — vidi tiket 11)_

1. Na [vercel.com](https://vercel.com) → **Add New → Project** → poveži GitHub repo
   `tatovic/StudyMate`. Root Directory ostaje `.` (Next.js se detektuje automatski).
2. U **Settings → Environment Variables** dodaj iste promenljive kao u `.env.local`
   (vrednosti iz istog Supabase projekta koji se koristi za razvoj — vidi `db.md`, 6.1):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon ili publishable ključ>
   ```
   `SUPABASE_SERVICE_ROLE_KEY` **ne treba** na Vercel-u — koristi ga samo test paket
   lokalno, aplikacija ga nikad ne učitava u runtime-u (vidi `tech.md`, sekcija 5).
3. Deploy. Vercel dodeljuje URL oblika `https://<projekat>.vercel.app` — upiši ga
   iznad i u `Site URL` iz koraka 4.
4. U Supabase Dashboardu podesi produkcijske vrednosti iz `db.md`, sekcija 6.1:
   **Authentication → URL Configuration** — `Site URL` na Vercel URL, i dodaj ga u
   `Redirect URLs` kao `https://<projekat>.vercel.app/**` (bez brisanja
   `http://localhost:3000/**`).
5. U **Authentication → Sign In / Providers → Email** uključi **Confirm email** —
   ostaje uključeno trajno, to je produkcijsko ponašanje.
6. Registruj se sa dva različita naloga na produkcijskom URL-u i proveri ceo tok:
   registracija → email → potvrda → izbor predmeta → kreiranje grupe → chat.

Pošto oba okruženja dele isti Supabase projekat, uključivanje **Confirm email** u
koraku 5 menja ponašanje i za lokalni razvoj (`signUp` više ne otvara sesiju odmah).
Ako to smeta tokom razvoja, privremeno ga isključi i ponovo uključi pre sledećeg
produkcijskog testa.

---

## Provere pre commita

```bash
npx tsc --noEmit && npm run lint && npm run build && npm test
```

## Testiranje

```bash
npm test          # jedinicni testovi + testovi pravila pristupa (Vitest)
npm run test:e2e  # end-to-end test glavnog toka (Playwright)
```

Testovi pravila pristupa i e2e test rade nad pravom Supabase bazom iz `.env.local` i
zahtevaju dodatnu promenljivu `SUPABASE_SERVICE_ROLE_KEY` (samo za ciscenje test
korisnika posle testa — vidi `.env.local.example` i `tech.md`, sekcija 8).
