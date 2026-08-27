# 11: Deploy na Vercel i produkcijska autentifikacija

**Šta se gradi:** Aplikacija je javno dostupna na internetu i neko ko nije programer može
da je otvori, registruje se i koristi. Potvrda email adrese, koja je za razvoj bila
isključena, u produkciji je uključena i cela putanja od registracije do potvrde radi na
pravom domenu.

**Blokiran od:** 10.

**Status:** u toku — kod i dokumentacija spremni, stvarni deploy radi korisnik ručno

Sam deploy na Vercel i podešavanje Supabase produkcijskih vrednosti (Site URL,
Redirect URLs, uključivanje Confirm email) zahtevaju pristup Vercel/Supabase nalogu i
rade se ručno kroz njihove dashboard-e — uputstvo korak po korak je u `README.md`,
sekcija "Deploy na Vercel". Ono što ne zavisi od naloga je završeno:

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
