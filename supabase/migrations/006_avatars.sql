-- ============================================================
-- StudyMate - Storage bucket za slike profila
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB, prati MAX_VELICINA_SLIKE u src/lib/validacija.ts
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Putanja fajla je uvek "<user_id>/avatar" (bez ekstenzije, upsert pri svakom
-- otpremanju) - tako stara slika nikad ne ostaje u skladistu kad se posalje nova,
-- a (storage.foldername(name))[1] daje id vlasnika za politike ispod.

create policy "korisnik otprema svoj avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "korisnik azurira svoj avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "korisnik brise svoj avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Citanje je javno preko bucket-a (public = true), pa nije potrebna posebna
-- select politika - Storage servira objekte bez RLS provere za public bucket-e.
