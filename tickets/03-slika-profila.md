# 03: Slika profila — upload, prikaz i zamena

**Šta se gradi:** Korisnik na svom profilu postavlja sliku, vidi je odmah posle
postavljanja i može je zameniti drugom. Slika se prikazuje svuda gde se korisnik pojavljuje
— u listi sličnih korisnika i u listi članova grupe. Korisnik bez slike dobija neutralan
zamenski prikaz (inicijali), nikad prazan okvir.

**Blokiran od:** 02.

**Status:** spremno

## Kriterijumi prihvatanja

- [ ] Korisnik bira sliku sa uređaja i postavlja je sa strane profila
- [ ] Postavljena slika se odmah vidi, bez ručnog osvežavanja strane
- [ ] Postavljanje nove slike zamenjuje staru; stara se ne gomila u skladištu
- [ ] Dozvoljeni su samo formati slika i razumna maksimalna veličina fajla;
      prekoračenje daje jasnu poruku na srpskom
- [ ] Korisnik može postaviti sliku isključivo na sopstveni profil
- [ ] Tuđe slike su vidljive svim prijavljenim korisnicima
- [ ] Korisnik bez slike se prikazuje zamenskim prikazom sa inicijalima
- [ ] Avatar se prikazuje u listi sličnih korisnika i u listi članova grupe
- [ ] Pravila skladišta i njegove politike pristupa dokumentovana u `db.md`
