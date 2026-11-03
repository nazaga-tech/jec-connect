-- JEC CONNECT phase 8 (cahier des charges final) : à exécuter après phase7.sql

-- 1. Réglages modifiables par l'administrateur (vidéo d'accueil)
create table public.reglages (
  cle text primary key, valeur text not null, maj_le timestamptz not null default now()
);
alter table public.reglages enable row level security;
create policy "lecture publique" on public.reglages for select using (true);
create policy "super admin ajoute" on public.reglages for insert with check (public.mon_role() = 'super_admin');
create policy "super admin modifie" on public.reglages for update using (public.mon_role() = 'super_admin');
create policy "super admin supprime" on public.reglages for delete using (public.mon_role() = 'super_admin');

-- 2. Rôle demandé à l'inscription (Membre ou Respo Approbateur) : simple demande, jamais un droit
alter table public.profiles add column if not exists role_demande text not null default 'membre';

create or replace function public.nouveau_profil() returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (id, prenom, nom, surnom, date_naissance, sexe, categorie, annee_adhesion,
    responsabilite, profession, telephone, role_demande)
  values (new.id, coalesce(m->>'prenom',''), coalesce(m->>'nom',''), m->>'surnom',
    nullif(m->>'date_naissance','')::date, m->>'sexe',
    case when m->>'categorie' = 'ancien' then 'ancien' else 'en_fonction' end,
    nullif(m->>'annee_adhesion','')::int, m->>'responsabilite', m->>'profession', m->>'telephone',
    case when m->>'role_demande' = 'respo' then 'respo' else 'membre' end);
  return new;
end $$;

-- 3. Médiathèque et opportunités : tout membre propose, un responsable valide
alter table public.contenus add column if not exists statut text not null default 'publie' check (statut in ('en_attente','publie','refuse'));
alter table public.contenus add column if not exists verifie boolean not null default false;

create function public.contenus_regles() returns trigger language plpgsql security definer set search_path = public as $$
declare r role_membre := public.mon_role(); c text;
begin
  if auth.uid() is null then return new; end if;
  select categorie into c from public.profiles where id = auth.uid();
  new.auteur := auth.uid();
  if new.type = 'actualite' and coalesce(r, 'membre') not in ('super_admin','validateur','moderateur') then
    raise exception 'Seuls les responsables publient des actualités';
  end if;
  if r in ('super_admin','validateur') then new.statut := 'publie'; new.verifie := true;
  elsif new.type = 'actualite' then new.statut := 'publie'; new.verifie := false;
  elsif new.type = 'opportunite' and c = 'ancien' then new.statut := 'publie'; new.verifie := true;
  else new.statut := 'en_attente'; new.verifie := false;
  end if;
  return new;
end $$;
create trigger contenus_regles before insert on public.contenus for each row execute function public.contenus_regles();

drop policy "membres approuvés lisent" on public.contenus;
drop policy "staff publie" on public.contenus;
create policy "lire le publié et le sien" on public.contenus for select using (
  public.est_approuve() and (statut = 'publie' or auteur = auth.uid() or public.mon_role() in ('super_admin','validateur','moderateur')));
create policy "membres proposent" on public.contenus for insert with check (public.est_approuve() and auteur = auth.uid());
create policy "validateurs valident" on public.contenus for update using (public.mon_role() in ('super_admin','validateur'));
create policy "supprimer ses propositions" on public.contenus for delete using (auteur = auth.uid() and statut = 'en_attente');
