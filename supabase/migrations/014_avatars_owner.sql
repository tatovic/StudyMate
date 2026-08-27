-- ============================================================
-- StudyMate - politike za avatars bez oslanjanja na auth.uid()
-- ============================================================
-- Utvrdjeno testom: unutar Storage zahteva auth.uid() vraca NULL, iako je JWT
-- ispravan i isti taj token radi bez problema kroz PostgREST (npr. update nad
-- profiles). Cim se iz politike ukloni provera "= auth.uid()::text",
-- otpremanje prolazi - dakle Storage servis ovog projekta ne prosledjuje
-- identitet korisnika u SQL kontekst (request.jwt.claims).
--
-- Resenje: umesto auth.uid() koristi se owner_id, koji sam Storage servis
-- popunjava iz tokena i na koji klijent ne moze da utice. Uslov trazi da se
-- prvi segment putanje ("<user_id>/avatar") poklapa sa vlasnikom reda, pa
-- korisnik i dalje moze da pise iskljucivo u sopstveni folder.
--
-- Javno citanje avatara ne ide kroz RLS (bucket je public = true), pa SELECT
-- politika ne utice na to da li drugi korisnici vide tudje slike.

drop policy if exists "korisnik otprema svoj avatar" on storage.objects;
drop policy if exists "korisnik azurira svoj avatar" on storage.objects;
drop policy if exists "korisnik brise svoj avatar"  on storage.objects;
drop policy if exists "korisnik cita svoj avatar"   on storage.objects;

create policy "korisnik otprema svoj avatar"
  on storage.objects for insert to public
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = owner_id::text);

create policy "korisnik cita svoj avatar"
  on storage.objects for select to public
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = owner_id::text);

create policy "korisnik azurira svoj avatar"
  on storage.objects for update to public
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = owner_id::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = owner_id::text);

create policy "korisnik brise svoj avatar"
  on storage.objects for delete to public
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = owner_id::text);
