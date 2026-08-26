# 03: Slika profila — upload, prikaz i zamena

**Šta se gradi:** Korisnik na svom profilu postavlja sliku, vidi je odmah posle
postavljanja i može je zameniti drugom. Slika se prikazuje svuda gde se korisnik pojavljuje
— u listi sličnih korisnika i u listi članova grupe. Korisnik bez slike dobija neutralan
zamenski prikaz (inicijali), nikad prazan okvir.

**Blokiran od:** 02.

**Status:** zavrseno

## Kriterijumi prihvatanja

- [x] Korisnik bira sliku sa uređaja i postavlja je sa strane profila
- [x] Postavljena slika se odmah vidi, bez ručnog osvežavanja strane
- [x] Postavljanje nove slike zamenjuje staru; stara se ne gomila u skladištu
- [x] Dozvoljeni su samo formati slika i razumna maksimalna veličina fajla;
      prekoračenje daje jasnu poruku na srpskom
- [x] Korisnik može postaviti sliku isključivo na sopstveni profil
- [x] Tuđe slike su vidljive svim prijavljenim korisnicima
- [x] Korisnik bez slike se prikazuje zamenskim prikazom sa inicijalima
- [x] Avatar se prikazuje u listi sličnih korisnika i u listi članova grupe
- [x] Pravila skladišta i njegove politike pristupa dokumentovana u `db.md`
