-- ============================================================
-- StudyMate - privatne grupe sa odobravanjem clanstva (tiket 08)
-- ============================================================

-- 1. Privatna grupa je sada vidljiva svim prijavljenima po nazivu (za pretragu),
--    da bi korisnik uopste mogao da je nadje i posalje zahtev za clanstvo.
--    Sadrzaj (clanovi, poruke) ostaje zasticen postojecim politikama nad
--    group_members i messages - one i dalje zahtevaju aktivno clanstvo.
--    Ovo je dodatna politika, ne zamena - kombinuje se sa OR sa politikom
--    iz 002_rls.sql, pa samo siri pristup.
create policy "sve grupe su vidljive prijavljenima po nazivu"
  on public.groups for select to authenticated using (true);

-- 2. Insert u group_members mora da razlikuje javnu i privatnu grupu:
--    javnoj se pridruzujes odmah kao 'aktivan' (jedan korak, bez odobravanja),
--    a za privatnu mozes samo da ubacis zahtev sa status='na_cekanju'.
--    Ovo MORA da zameni staru politiku, ne da je dopuni - dodatna permisivna
--    politika bi se samo OR-ovala sa postojecom (auth.uid() = user_id, bez
--    provere statusa) i ne bi ogranicila nista. Stara politika je iz
--    002_rls.sql i ovde se namerno brise i pravi ponovo iz istog razloga
--    zbog kog to inace ne radimo - stvarna bezbednosna rupa: bez ovoga bi
--    svako mogao da zaobidje odobravanje tako sto direktno insertuje
--    status='aktivan' u tudju privatnu grupu mimo Server Action-a.
drop policy "pridruzujes se sam" on public.group_members;

create policy "pridruzujes se sam"
  on public.group_members for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      status = 'na_cekanju'
      or exists (select 1 from public.groups g where g.id = group_id and g.is_public)
    )
  );

-- 3. Vlasnik odobrava zahtev na cekanju (status na_cekanju -> aktivan).
--    Ranije nije postojala nijedna UPDATE politika nad group_members, pa je
--    ovo cisto nova komanda, ne zamena. Provera da odobravanje ne bi
--    premasilo max_clanova ide u Server Action-u (isti razlog kao kod
--    izmene max_clanova u tiketu 07 - zavisi od trenutnog broja clanova u
--    trenutku izvrsavanja, ne moze biti CHECK ogranicenje).
--    Odbijanje zahteva ne treba novu politiku - vec postojeca "vlasnik
--    uklanja clana iz grupe" (010) dozvoljava vlasniku da obrise bilo koje
--    clanstvo u svojoj grupi, bez obzira na status.
create policy "vlasnik odobrava zahtev za clanstvo"
  on public.group_members for update to authenticated
  using (
    status = 'na_cekanju'
    and exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  )
  with check (
    status = 'aktivan'
    and exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  );
