-- ============================================================
-- StudyMate - pronalazenje korisnika sa slicnim interesovanjima
-- Poziv iz aplikacije: supabase.rpc('pronadji_slicne', { limit_n: 20 })
-- ============================================================

create function public.pronadji_slicne(limit_n int default 20)
returns table (
  id            uuid,
  ime           text,
  skola         text,
  opis          text,
  avatar_url    text,
  zajednicki    bigint,
  predmeti      text[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.ime,
    p.skola,
    p.opis,
    p.avatar_url,
    count(*) as zajednicki,
    array_agg(s.naziv order by s.naziv) as predmeti
  from public.user_subjects moji
  join public.user_subjects tudji
    on tudji.subject_id = moji.subject_id
   and tudji.user_id <> moji.user_id
  join public.profiles p on p.id = tudji.user_id
  join public.subjects s on s.id = moji.subject_id
  where moji.user_id = auth.uid()
  group by p.id, p.ime, p.skola, p.opis, p.avatar_url
  order by zajednicki desc, p.ime
  limit limit_n;
$$;

-- Preporuka grupa: javne grupe iz predmeta koje korisnik uci, a nije clan.
create function public.preporuci_grupe(limit_n int default 20)
returns table (
  id           bigint,
  naziv        text,
  opis         text,
  predmet      text,
  broj_clanova bigint,
  max_clanova  int
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    g.id,
    g.naziv,
    g.opis,
    s.naziv as predmet,
    count(gm.user_id) as broj_clanova,
    g.max_clanova
  from public.groups g
  join public.subjects s on s.id = g.subject_id
  join public.user_subjects us
    on us.subject_id = g.subject_id and us.user_id = auth.uid()
  left join public.group_members gm
    on gm.group_id = g.id and gm.status = 'aktivan'
  where g.is_public
    and not exists (
      select 1 from public.group_members m
      where m.group_id = g.id and m.user_id = auth.uid()
    )
  group by g.id, g.naziv, g.opis, s.naziv, g.max_clanova
  having count(gm.user_id) < g.max_clanova
  order by broj_clanova desc, g.created_at desc
  limit limit_n;
$$;
