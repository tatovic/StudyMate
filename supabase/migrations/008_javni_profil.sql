-- ============================================================
-- StudyMate - javni profil korisnika (tiket 04)
-- Dodatna politika: clanstva u javnim grupama vidljiva su svim
-- prijavljenim korisnicima, ne samo clanovima/vlasniku te grupe.
-- Potrebno da bi javni profil mogao da prikaze javne grupe ciji je
-- posmatrani korisnik clan (FR-9). Politike nad istom komandom se
-- kombinuju sa OR, pa postojeca politika iz 002_rls.sql ostaje
-- netaknuta - ovo je dodatna, sirenje pristupa, ne zamena.
-- Privatne grupe ostaju sakrivene: uslov proverava is_public direktno.
-- ============================================================

create policy "clanstva u javnim grupama su vidljiva svima"
  on public.group_members for select to authenticated
  using (exists (
    select 1 from public.groups g where g.id = group_id and g.is_public
  ));
