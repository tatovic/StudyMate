-- ============================================================
-- StudyMate - ispravka politika za avatars (vidi 006_avatars.sql)
-- ============================================================
-- Storage servis ovog projekta ocigledno ne prebacuje konekciju na ulogu
-- "authenticated" na isti nacin kao PostgREST (potvrdjeno tokom razvoja -
-- identican INSERT sa "set local role authenticated" prolazi u SQL editoru,
-- ali stvarni zahtev preko Storage API-ja i dalje pada na "to authenticated"
-- politikama). Politike se zato menjaju da vaze za "public", a bezbednost i
-- dalje cuva sam uslov: auth.uid() je NULL za neprijavljen zahtev, pa
-- "(storage.foldername(name))[1] = auth.uid()::text" nikad nije tacno za
-- nekog ko nije prijavljen.

drop policy "korisnik otprema svoj avatar" on storage.objects;
drop policy "korisnik azurira svoj avatar" on storage.objects;
drop policy "korisnik brise svoj avatar" on storage.objects;

create policy "korisnik otprema svoj avatar"
  on storage.objects for insert to public
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "korisnik azurira svoj avatar"
  on storage.objects for update to public
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "korisnik brise svoj avatar"
  on storage.objects for delete to public
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
