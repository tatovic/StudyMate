-- ============================================================
-- StudyMate - upravljanje grupom za vlasnika (tiket 07)
-- Dodatna politika: vlasnik grupe sme da obrise clanstvo bilo kog
-- drugog clana (uklanjanje iz grupe), ne samo svoje.
-- Politike nad istom komandom se kombinuju sa OR, pa postojeca
-- "napustas grupu sam" iz 002_rls.sql ostaje netaknuta - ovo je
-- dodatna, sirenje pristupa za vlasnika, ne zamena.
-- Izmena i brisanje same grupe vec su ogranicene na vlasnika
-- postojecim politikama iz 002_rls.sql - nema promene tamo.
-- ============================================================

create policy "vlasnik uklanja clana iz grupe"
  on public.group_members for delete to authenticated
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.owner_id = auth.uid()
    )
  );
