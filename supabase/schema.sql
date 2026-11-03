-- JEC CONNECT : à exécuter dans Supabase > SQL Editor

create type role_membre as enum ('membre','moderateur','validateur','super_admin');
create type statut_compte as enum ('en_attente','approuve','refuse','suspendu');

create sequence matricule_seq start 1000;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  matricule text unique not null default ('JEC-' || nextval('matricule_seq')),
  prenom text not null, nom text not null, surnom text,
  date_naissance date, sexe text, categorie text not null default 'en_fonction',
  annee_adhesion int, section text, paroisse text, responsabilite text,
  profession text, entreprise text, telephone text,
  naissance_visible boolean not null default false,
  role role_membre not null default 'membre',
  statut statut_compte not null default 'en_attente',
  cree_le timestamptz not null default now()
);

-- Création automatique du profil à l'inscription (rôle et statut toujours par défaut)
create function public.nouveau_profil() returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (id, prenom, nom, surnom, date_naissance, sexe, categorie, annee_adhesion,
    section, paroisse, responsabilite, profession, entreprise, telephone)
  values (new.id, coalesce(m->>'prenom',''), coalesce(m->>'nom',''), m->>'surnom',
    nullif(m->>'date_naissance','')::date, m->>'sexe',
    case when m->>'categorie' = 'ancien' then 'ancien' else 'en_fonction' end,
    nullif(m->>'annee_adhesion','')::int, m->>'section', m->>'paroisse', m->>'responsabilite',
    m->>'profession', m->>'entreprise', m->>'telephone');
  return new;
end $$;
create trigger apres_inscription after insert on auth.users for each row execute function public.nouveau_profil();

-- Rôle de l'utilisateur courant (évite la récursion RLS)
create function public.mon_role() returns role_membre language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

alter table public.profiles enable row level security;

create policy "voir son profil" on public.profiles for select using (id = auth.uid());
create policy "staff voit tout" on public.profiles for select using (public.mon_role() in ('super_admin','validateur','moderateur'));
create policy "membres approuvés voient les approuvés" on public.profiles for select
  using (statut = 'approuve' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.statut = 'approuve'));
create policy "modifier son profil" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "validateurs gèrent les statuts" on public.profiles for update using (public.mon_role() in ('super_admin','validateur'));

-- Un membre ne peut jamais changer son propre rôle ni son statut
create function public.proteger_privileges() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role) and coalesce(public.mon_role(),'membre') <> 'super_admin' then
    raise exception 'Modification du rôle interdite';
  end if;
  if (new.statut is distinct from old.statut) and coalesce(public.mon_role(),'membre') not in ('super_admin','validateur') then
    raise exception 'Modification du statut interdite';
  end if;
  new.matricule := old.matricule;
  return new;
end $$;
create trigger proteger_privileges before update on public.profiles for each row execute function public.proteger_privileges();

-- Pour créer le premier super administrateur, après votre inscription :
-- update public.profiles set role='super_admin', statut='approuve' where id = (select id from auth.users where email='VOTRE_EMAIL');
