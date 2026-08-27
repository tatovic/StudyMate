-- ============================================================
-- StudyMate - popravka tiketa 08: vlasnik privatne grupe ostajao
-- bez sopstvenog clanstva
-- ============================================================
--
-- 011_privatne_grupe.sql je zamenila INSERT politiku nad group_members tako
-- da status='aktivan' prolazi samo za javnu grupu. Time je slucajno pokrila
-- i upis vlasnika u sopstvenu (privatnu) grupu, koji napraviGrupu radi odmah
-- posle INSERT-a u groups (actions.ts). Za privatnu grupu je taj upis
-- odbijan, pa vlasnik nikad nije postajao clan svoje grupe: je_clan() za
-- njega vraca false, ne vidi clanove, ne vidi zahteve na cekanju i ne moze
-- da pise u chat sopstvene grupe.
--
-- Ova politika ponovo zamenjuje "pridruzujes se sam" (isti razlog kao u 011 -
-- permisivne politike se OR-uju, pa dodatna politika ne bi mogla da ogranici
-- nista) i dodaje uslov g.owner_id = auth.uid(): vlasnik sme da upise sebe
-- kao aktivnog clana svoje grupe, bez obzira na is_public. Bezbedno je jer
-- uz auth.uid() = user_id ovaj uslov vazi samo za vlasnika nad sopstvenom
-- grupom - niko drugi i dalje ne moze da zaobidje odobravanje.
drop policy if exists "pridruzujes se sam" on public.group_members;

create policy "pridruzujes se sam"
  on public.group_members for insert to authenticated
  with check (
    auth.uid() = user_id
    and (
      status = 'na_cekanju'
      or exists (
        select 1 from public.groups g
        where g.id = group_id and (g.is_public or g.owner_id = auth.uid())
      )
    )
  );
