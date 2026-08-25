# 07: Upravljanje grupom za vlasnika

**Šta se gradi:** Vlasnik grupe dobija kontrolu nad njom: menja naziv, opis, predmet,
maksimalan broj članova i vidljivost; uklanja člana; briše grupu. Član i dalje može samo
da napusti grupu. Sve destruktivne radnje traže potvrdu, jer se brisanjem grupe gube i
sve njene poruke.

**Blokiran od:** 06.

**Status:** spremno

## Kriterijumi prihvatanja

- [ ] Vlasnik na strani grupe vidi kontrole za izmenu koje ostali članovi ne vide
- [ ] Vlasnik menja naziv, opis, predmet, maksimalan broj članova i vidljivost grupe
- [ ] Maksimalan broj članova ne može biti manji od trenutnog broja članova
- [ ] Vlasnik uklanja člana iz grupe; uklonjeni član gubi pristup chatu
- [ ] Vlasnik ne može ukloniti samog sebe
- [ ] Vlasnik briše grupu uz eksplicitnu potvrdu koja navodi posledice
- [ ] Brisanjem grupe brišu se i njena članstva i poruke
- [ ] Član napušta grupu uz potvrdu; vlasniku ta opcija nije ponuđena
- [ ] Pokušaj izmene ili brisanja tuđe grupe je odbijen i na nivou baze, ne samo u UI
- [ ] Posle brisanja korisnik završava na listi grupa sa porukom o uspehu
