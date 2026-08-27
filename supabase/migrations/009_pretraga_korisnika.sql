-- ============================================================
-- StudyMate - pretraga i filtriranje korisnika (tiket 05)
-- Za razliku od pronadji_slicne (koja vraca samo korisnike sa bar
-- jednim zajednickim predmetom, ograniceno na limit_n), ova funkcija
-- vraca SVE korisnike (osim pozivaoca), uz opcionu pretragu po imenu
-- i filtere po predmetu/nivou, tako da stranica za pretragu moze da
-- prikaze celu listu, ne samo preporuke.
-- Poziv iz aplikacije:
--   supabase.rpc('pretrazi_korisnike', {
--     pretraga: 'ana', p_subject_id: 3, p_nivo: 'srednji'
--   })
-- ============================================================

create function public.pretrazi_korisnike(
  pretraga      text default null,
  p_subject_id  bigint default null,
  p_nivo        text default null
)
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
    coalesce(zaj.zajednicki, 0) as zajednicki,
    coalesce(zaj.predmeti, '{}') as predmeti
  from public.profiles p
  left join (
    -- Isti obrazac kao u pronadji_slicne (003_matching.sql): self-join
    -- user_subjects preko subject_id da se dobije broj i spisak predmeta
    -- zajednickih sa pozivaocem.
    select
      tudji.user_id,
      count(*) as zajednicki,
      array_agg(s.naziv order by s.naziv) as predmeti
    from public.user_subjects moji
    join public.user_subjects tudji
      on tudji.subject_id = moji.subject_id
     and tudji.user_id <> moji.user_id
    join public.subjects s on s.id = moji.subject_id
    where moji.user_id = auth.uid()
    group by tudji.user_id
  ) zaj on zaj.user_id = p.id
  where p.id <> auth.uid()
    and (pretraga is null or p.ime ilike '%' || pretraga || '%')
    and (
      p_subject_id is null
      or exists (
        select 1 from public.user_subjects us
        where us.user_id = p.id
          and us.subject_id = p_subject_id
          and (p_nivo is null or us.nivo = p_nivo)
      )
    )
  order by zajednicki desc, p.ime;
$$;

grant execute on function public.pretrazi_korisnike(text, bigint, text) to authenticated;
