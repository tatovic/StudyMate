-- ============================================================
-- StudyMate - Row Level Security
-- BEZ ovoga je baza otvorena: anon kljuc je javan i vidljiv u browseru.
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.subjects      enable row level security;
alter table public.user_subjects enable row level security;
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.messages      enable row level security;

-- Pomocna funkcija: da li je korisnik aktivan clan grupe.
-- SECURITY DEFINER zaobilazi RLS i sprecava beskonacnu rekurziju
-- (politika nad group_members koja bi citala group_members).
create function public.je_clan(g_id bigint)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = g_id and user_id = auth.uid() and status = 'aktivan'
  );
$$;

-- ---------- PROFILES ----------
create policy "profili su vidljivi prijavljenima"
  on public.profiles for select to authenticated using (true);

create policy "menjas samo svoj profil"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- SUBJECTS (read-only katalog) ----------
create policy "predmeti su vidljivi svima"
  on public.subjects for select to authenticated using (true);

-- ---------- USER_SUBJECTS ----------
create policy "vidis sve veze korisnik-predmet"
  on public.user_subjects for select to authenticated using (true);

create policy "dodajes predmete samo sebi"
  on public.user_subjects for insert to authenticated
  with check (auth.uid() = user_id);

create policy "brises predmete samo sebi"
  on public.user_subjects for delete to authenticated
  using (auth.uid() = user_id);

-- ---------- GROUPS ----------
create policy "javne grupe i grupe cijim si clan"
  on public.groups for select to authenticated
  using (is_public or public.je_clan(id) or owner_id = auth.uid());

create policy "kreiras grupu kao vlasnik"
  on public.groups for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "samo vlasnik menja grupu"
  on public.groups for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "samo vlasnik brise grupu"
  on public.groups for delete to authenticated using (auth.uid() = owner_id);

-- ---------- GROUP_MEMBERS ----------
create policy "vidis clanstva svojih grupa"
  on public.group_members for select to authenticated
  using (user_id = auth.uid() or public.je_clan(group_id));

create policy "pridruzujes se sam"
  on public.group_members for insert to authenticated
  with check (auth.uid() = user_id);

create policy "napustas grupu sam"
  on public.group_members for delete to authenticated
  using (auth.uid() = user_id);

-- ---------- MESSAGES ----------
create policy "citas poruke svojih grupa"
  on public.messages for select to authenticated
  using (public.je_clan(group_id));

create policy "pises poruke u svojim grupama"
  on public.messages for insert to authenticated
  with check (auth.uid() = user_id and public.je_clan(group_id));

create policy "brises svoje poruke"
  on public.messages for delete to authenticated
  using (auth.uid() = user_id);

-- Realtime chat
alter publication supabase_realtime add table public.messages;
