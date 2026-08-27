# 03: Slika profila — upload, prikaz i zamena

**Šta se gradi:** Korisnik na svom profilu postavlja sliku, vidi je odmah posle
postavljanja i može je zameniti drugom. Slika se prikazuje svuda gde se korisnik pojavljuje
— u listi sličnih korisnika i u listi članova grupe. Korisnik bez slike dobija neutralan
zamenski prikaz (inicijali), nikad prazan okvir.

**Blokiran od:** 02.

**Status:** blokirano — otpremanje ne radi, poznat problem dokumentovan u `db.md`
(sekcija 8, ⚠️). Kod (Server Action, RLS politike, prikaz) je napisan i pripremljen,
ali stvarno otpremanje fajla pada na Storage servisu ovog Supabase projekta iz
razloga koji nije razrešen (potvrđeno da nije bag u aplikaciji — vidi istragu u `db.md`).

## Kriterijumi prihvatanja

- [ ] Korisnik bira sliku sa uređaja i postavlja je sa strane profila — **blokirano**
- [ ] Postavljena slika se odmah vidi, bez ručnog osvežavanja strane — **blokirano**
- [ ] Postavljanje nove slike zamenjuje staru; stara se ne gomila u skladištu — **blokirano**
- [ ] Dozvoljeni su samo formati slika i razumna maksimalna veličina fajla;
      prekoračenje daje jasnu poruku na srpskom — logika napisana i jedinično testirana,
      nije potvrđeno u browseru
- [ ] Korisnik može postaviti sliku isključivo na sopstveni profil — **blokirano**
- [ ] Tuđe slike su vidljive svim prijavljenim korisnicima — nije moguće testirati
      dok otpremanje ne radi
- [x] Korisnik bez slike se prikazuje zamenskim prikazom sa inicijalima — potvrđeno u browseru
- [ ] Avatar se prikazuje u listi sličnih korisnika i u listi članova grupe — kod postoji,
      nije vizuelno potvrđeno sa stvarnom slikom
- [x] Pravila skladišta i njegove politike pristupa dokumentovana u `db.md`
