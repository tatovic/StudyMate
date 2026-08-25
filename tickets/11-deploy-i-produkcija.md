# 11: Deploy na Vercel i produkcijska autentifikacija

**Šta se gradi:** Aplikacija je javno dostupna na internetu i neko ko nije programer može
da je otvori, registruje se i koristi. Potvrda email adrese, koja je za razvoj bila
isključena, u produkciji je uključena i cela putanja od registracije do potvrde radi na
pravom domenu.

**Blokiran od:** 10.

**Status:** spremno

## Kriterijumi prihvatanja

- [ ] Aplikacija je dostupna na javnom URL-u
- [ ] Promenljive okruženja su podešene na hostingu; nijedan ključ nije u repou
- [ ] Registracija na produkciji šalje email za potvrdu
- [ ] Link iz emaila vodi na produkcijski domen i uspešno potvrđuje nalog
- [ ] Adrese za preusmeravanje posle prijave su podešene na produkcijski domen
- [ ] Potvrđen korisnik završava prijavljen na početnoj strani aplikacije
- [ ] Nepotvrđen korisnik dobija jasno objašnjenje šta treba da uradi
- [ ] Ceo tok registracija → potvrda → izbor predmeta → kreiranje grupe → chat
      proveren na produkciji sa dva različita naloga
- [ ] `README.md` sadrži javni URL i uputstvo za deploy
- [ ] `db.md` sekcija o podešavanjima Supabase projekta razlikuje razvoj i produkciju
