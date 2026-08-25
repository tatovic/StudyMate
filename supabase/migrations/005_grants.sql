-- ============================================================
-- StudyMate - tabelarne privilegije
-- ============================================================
-- RLS i GRANT su dva odvojena sloja:
--   GRANT  -> sme li rola uopste da dodirne tabelu
--   RLS    -> koje redove sme da vidi/menja
-- Bez GRANT-a PostgREST vraca 42501 "permission denied for table"
-- i pre nego sto RLS politike dodju na red.
-- ============================================================

grant usage on schema public to anon, authenticated;

-- Katalog predmeta je samo za citanje.
grant select on public.subjects to authenticated;

-- Tabele nad kojima korisnik radi; sta sme konkretno,
-- odredjuju RLS politike iz 002_rls.sql.
grant select, insert, update, delete on
  public.profiles,
  public.user_subjects,
  public.groups,
  public.group_members,
  public.messages
to authenticated;

-- RPC funkcije za preporuke.
grant execute on function public.pronadji_slicne(int)  to authenticated;
grant execute on function public.preporuci_grupe(int)  to authenticated;
grant execute on function public.je_clan(bigint)       to authenticated;

-- Da buduce tabele u schema public automatski dobiju privilegije.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
