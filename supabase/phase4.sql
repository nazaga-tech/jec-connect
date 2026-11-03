-- JEC CONNECT phase 4 : à exécuter après schema.sql

alter table public.profiles
  add column if not exists slogan text,
  add column if not exists presentation text,
  add column if not exists devise text,
  add column if not exists fond_carte int not null default 0;

create table public.contenus (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('actualite','document','compte_rendu','opportunite')),
  titre text not null,
  corps text,
  url text,
  auteur uuid references public.profiles(id) default auth.uid(),
  cree_le timestamptz not null default now()
);
alter table public.contenus enable row level security;

create policy "membres approuvés lisent" on public.contenus for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.statut = 'approuve'));
create policy "staff publie" on public.contenus for insert
  with check (public.mon_role() in ('super_admin','validateur','moderateur'));
create policy "staff supprime" on public.contenus for delete
  using (public.mon_role() in ('super_admin','validateur','moderateur'));
