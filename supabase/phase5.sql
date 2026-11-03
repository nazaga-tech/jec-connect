-- JEC CONNECT phase 5 : à exécuter après phase4.sql

alter table public.profiles add column if not exists avatar_url text;

create function public.est_approuve() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and statut = 'approuve') $$;

-- Sécurité : les membres ne lisent plus les profils des autres directement
-- (téléphone, date de naissance...). Ils passent par les fonctions ci-dessous.
drop policy if exists "membres approuvés voient les approuvés" on public.profiles;

create function public.annuaire() returns table (id uuid, prenom text, nom text, surnom text, categorie text,
  annee_adhesion int, section text, profession text, avatar_url text, matricule text)
language sql stable security definer set search_path = public as $$
  select p.id, p.prenom, p.nom, p.surnom, p.categorie, p.annee_adhesion, p.section, p.profession, p.avatar_url, p.matricule
  from public.profiles p where p.statut = 'approuve' and public.est_approuve()
$$;

create function public.anniversaires() returns table (id uuid, prenom text, surnom text, date_naissance date, avatar_url text)
language sql stable security definer set search_path = public as $$
  select p.id, p.prenom, p.surnom, p.date_naissance, p.avatar_url
  from public.profiles p where p.statut = 'approuve' and p.naissance_visible and p.date_naissance is not null and public.est_approuve()
$$;

create table public.groupes (
  id uuid primary key default gen_random_uuid(),
  nom text unique not null,
  type text not null default 'general' check (type in ('general','section','generation'))
);
insert into public.groupes (nom, type) values ('Général', 'general');
alter table public.groupes enable row level security;
create policy "lire groupes" on public.groupes for select using (public.est_approuve());
create policy "staff crée groupes" on public.groupes for insert with check (public.mon_role() in ('super_admin','validateur','moderateur'));
create policy "staff supprime groupes" on public.groupes for delete using (public.mon_role() in ('super_admin','validateur','moderateur'));

create table public.blocages (
  bloqueur uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  bloque uuid not null references public.profiles(id) on delete cascade,
  primary key (bloqueur, bloque)
);
alter table public.blocages enable row level security;
create policy "mes blocages" on public.blocages for all using (bloqueur = auth.uid()) with check (bloqueur = auth.uid());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  auteur uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  groupe_id uuid references public.groupes(id) on delete cascade,
  destinataire uuid references public.profiles(id) on delete cascade,
  texte text not null check (char_length(texte) between 1 and 2000),
  cree_le timestamptz not null default now(),
  check ((groupe_id is null) <> (destinataire is null))
);
alter table public.messages enable row level security;
create policy "lire messages" on public.messages for select
  using (public.est_approuve() and (groupe_id is not null or auteur = auth.uid() or destinataire = auth.uid()));
create policy "écrire messages" on public.messages for insert
  with check (public.est_approuve() and auteur = auth.uid()
    and not exists (select 1 from public.blocages b where b.bloqueur = destinataire and b.bloque = auth.uid()));
create policy "staff supprime messages" on public.messages for delete using (public.mon_role() in ('super_admin','moderateur'));
alter publication supabase_realtime add table public.messages;

create table public.signalements (
  id uuid primary key default gen_random_uuid(),
  auteur uuid not null default auth.uid(),
  cible uuid not null references public.profiles(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  motif text not null default 'Contenu inapproprié',
  cree_le timestamptz not null default now()
);
alter table public.signalements enable row level security;
create policy "signaler" on public.signalements for insert with check (public.est_approuve() and auteur = auth.uid());
create policy "staff lit signalements" on public.signalements for select using (public.mon_role() in ('super_admin','moderateur'));

-- Photos de profil
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
create policy "avatars lecture" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars envoi" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
