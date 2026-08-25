-- Pocetni katalog predmeta
insert into public.subjects (naziv, kategorija) values
  ('Matematika',              'Prirodne nauke'),
  ('Fizika',                  'Prirodne nauke'),
  ('Hemija',                  'Prirodne nauke'),
  ('Biologija',               'Prirodne nauke'),
  ('Programiranje',           'Informatika'),
  ('Baze podataka',           'Informatika'),
  ('Algoritmi i strukture',   'Informatika'),
  ('Web programiranje',       'Informatika'),
  ('Engleski jezik',          'Jezici'),
  ('Nemacki jezik',           'Jezici'),
  ('Srpski jezik',            'Jezici'),
  ('Istorija',                'Drustvene nauke'),
  ('Geografija',              'Drustvene nauke'),
  ('Ekonomija',               'Drustvene nauke'),
  ('Statistika',              'Drustvene nauke')
on conflict (naziv) do nothing;
