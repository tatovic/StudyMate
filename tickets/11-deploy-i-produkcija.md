# 11: Deploy na Vercel i produkcijska autentifikacija

**Šta se gradi:** Aplikacija je javno dostupna na internetu i neko ko nije programer može
da je otvori, registruje se i koristi. Potvrda email adrese, koja je za razvoj bila
isključena, u produkciji je uključena i cela putanja od registracije do potvrde radi na
pravom domenu.

**Blokiran od:** 10.

**Status:** neće se raditi — deploy nije u planu

Vercel deploy je odlučeno da se ne radi, pa kriterijumi vezani za javni URL i
produkcijsku proveru na dva naloga ne mogu da se ispune i ostaju neštiklirani. Deo
tiketa koji se odnosi na produkcijsku autentifikaciju je ipak završen — koristan je i
nezavisan od toga da li aplikacija ikad ode na hosting. `README.md` (sekcija "Deploy
na Vercel") i `db.md` (sekcija 6.1) ostaju kao referenca za slučaj da se odluka
kasnije promeni.

- registracija eksplicitno šalje `emailRedirectTo` sa domenom sa kog je zahtev stigao
  (`src/lib/site-url.ts`), pa link za potvrdu radi na bilo kom domenu bez ručnog
  podešavanja promenljive okruženja
- kad je Confirm email uključeno, `signUp` više ne otvara sesiju odmah — korisnik se
  preusmerava na `/login` sa jasnom porukom umesto na `/dashboard` bez sesije
  (`ObavestenjeBaner`, `src/app/login/actions.ts`)
- pokušaj prijave na nepotvrđen nalog već je imao jasnu poruku (`email_not_confirmed`
  u `src/lib/auth-greske.ts`, iz tiketa o autentifikaciji)
- istekao/nevažeći link za potvrdu prikazuje poruku na `/login` umesto tihog pada

## Kriterijumi prihvatanja

- [ ] Aplikacija je dostupna na javnom URL-u
- [ ] Promenljive okruženja su podešene na hostingu; nijedan ključ nije u repou
- [ ] Registracija na produkciji šalje email za potvrdu
- [ ] Link iz emaila vodi na produkcijski domen i uspešno potvrđuje nalog
- [ ] Adrese za preusmeravanje posle prijave su podešene na produkcijski domen
- [ ] Potvrđen korisnik završava prijavljen na početnoj strani aplikacije
- [x] Nepotvrđen korisnik dobija jasno objašnjenje šta treba da uradi
- [ ] Ceo tok registracija → potvrda → izbor predmeta → kreiranje grupe → chat
      proveren na produkciji sa dva različita naloga
- [x] `README.md` sadrži uputstvo za deploy (javni URL se upisuje posle prvog deploya)
- [x] `db.md` sekcija o podešavanjima Supabase projekta razlikuje razvoj i produkciju
