-- Realtime DELETE dogadjaji nose samo REPLICA IDENTITY kolone u "old" delu payload-a.
-- Podrazumevano je to samo primarni kljuc (id), pa RLS politika "citas poruke svojih
-- grupa" (koja proverava group_id preko je_clan()) ne moze da se izracuna za brisanje -
-- Realtime bez dovoljno podataka ne isporucuje DELETE dogadjaj nikome. FULL identitet
-- nosi sve kolone (ukljucujuci group_id i user_id) u "old" zapisu, pa obrisana poruka
-- stize uzivo ostalim clanovima grupe bez osvezavanja strane (tiket 09).
alter table public.messages replica identity full;
