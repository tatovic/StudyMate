-- ============================================================
-- StudyMate - sema baze
-- Pokrenuti u Supabase Dashboard -> SQL Editor
-- ============================================================

-- ---------- PROFILI ----------
-- Ne pravimo tabelu "users" - Supabase vec ima auth.users.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  ime         text not null,
  skola       text,
  opis        text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Automatsko kreiranje profila pri registraciji
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, ime)
  values (new.id, coalesce(new.raw_user_meta_data->>'ime', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- PREDMETI ----------
create table public.subjects (
  id         bigint generated always as identity primary key,
  naziv      text not null unique,
  kategorija text
);

create table public.user_subjects (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  subject_id bigint not null references public.subjects(id) on delete cascade,
  nivo       text   not null default 'srednji'
             check (nivo in ('pocetnik', 'srednji', 'napredni')),
  primary key (user_id, subject_id)
);

-- ---------- GRUPE ----------
create table public.groups (
  id          bigint generated always as identity primary key,
  naziv       text   not null,
  opis        text,
  subject_id  bigint references public.subjects(id) on delete set null,
  owner_id    uuid   not null references public.profiles(id) on delete cascade,
  max_clanova int    not null default 10 check (max_clanova between 2 and 100),
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.group_members (
  group_id  bigint not null references public.groups(id) on delete cascade,
  user_id   uuid   not null references public.profiles(id) on delete cascade,
  uloga     text   not null default 'clan'  check (uloga in ('vlasnik', 'clan')),
  status    text   not null default 'aktivan' check (status in ('na_cekanju', 'aktivan')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ---------- PORUKE ----------
create table public.messages (
  id         bigint generated always as identity primary key,
  group_id   bigint not null references public.groups(id) on delete cascade,
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  tekst      text   not null check (char_length(tekst) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ---------- INDEKSI ----------
create index on public.user_subjects (subject_id);
create index on public.groups (subject_id);
create index on public.group_members (user_id);
create index on public.messages (group_id, created_at desc);
