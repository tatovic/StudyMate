# 08: Privatne grupe sa odobravanjem članstva

**Šta se gradi:** Privatna grupa prestaje da bude samo skrivena i postaje grupa u koju se
ulazi na poziv vlasnika. Korisnik koji naiđe na privatnu grupu šalje zahtev za članstvo;
vlasnik na strani grupe vidi zahteve na čekanju i svaki odobrava ili odbija. Do odobrenja
podnosilac ne vidi chat.

Šema već podržava ovo: `group_members.status` ima vrednosti `na_cekanju` i `aktivan`,
ali se `na_cekanju` nigde ne koristi. Ovaj tiket ga aktivira.

**Blokiran od:** 07.

**Status:** zavrseno

## Kriterijumi prihvatanja

- [x] Privatna grupa je vidljiva u pretrazi po nazivu, ali bez sadržaja chata
- [x] Korisnik šalje zahtev za članstvo u privatnu grupu
- [x] Podnosilac vidi da je zahtev poslat i ne može poslati isti zahtev dvaput
- [x] Vlasnik na strani grupe vidi listu zahteva na čekanju sa imenom i predmetima podnosioca
- [x] Vlasnik odobrava zahtev i podnosilac postaje aktivan član
- [x] Vlasnik odbija zahtev i podnosilac prestaje da bude na listi
- [x] Zahtev na čekanju se ne računa u popunjenost grupe
- [x] Zahtev se ne može odobriti ako bi grupa time premašila maksimalan broj članova
- [x] Korisnik sa zahtevom na čekanju ne vidi poruke grupe ni preko upita ni uživo
- [x] Pridruživanje javnoj grupi i dalje radi u jednom koraku, bez odobravanja
- [x] Promene politika pristupa dokumentovane u `db.md`
