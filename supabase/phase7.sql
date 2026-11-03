-- JEC CONNECT phase 7 (sécurité) : à exécuter après phase6b.sql

-- 1. Protection des privilèges : corrige le blocage du SQL Editor (auth.uid() est nul hors connexion d'un membre)
--    et verrouille l'identité (nom, prénom, naissance, catégorie, année) : seuls les responsables peuvent la corriger.
create or replace function public.proteger_privileges() returns trigger language plpgsql security definer set search_path = public as $$
declare r role_membre := public.mon_role();
begin
  if auth.uid() is null then return new; end if;
  if (new.role is distinct from old.role) and coalesce(r, 'membre') <> 'super_admin' then
    raise exception 'Modification du rôle interdite';
  end if;
  if (new.statut is distinct from old.statut) and coalesce(r, 'membre') not in ('super_admin', 'validateur') then
    raise exception 'Modification du statut interdite';
  end if;
  if coalesce(r, 'membre') not in ('super_admin', 'validateur') and (
       new.nom is distinct from old.nom or new.prenom is distinct from old.prenom
       or new.date_naissance is distinct from old.date_naissance or new.categorie is distinct from old.categorie
       or new.annee_adhesion is distinct from old.annee_adhesion) then
    raise exception 'Ces informations ne peuvent être corrigées que par un responsable';
  end if;
  new.matricule := old.matricule;
  return new;
end $$;

-- 2. Le blocage d'un membre doit réellement empêcher ses messages privés
create function public.est_bloque_par(p_dest uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.blocages where bloqueur = p_dest and bloque = auth.uid()) $$;

drop policy "écrire messages" on public.messages;
create policy "écrire messages" on public.messages for insert
  with check (public.est_approuve() and auteur = auth.uid() and not coalesce(public.est_bloque_par(destinataire), false));

-- 3. Anti-spam : 20 messages par minute au maximum
create function public.limiter_messages() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.messages where auteur = new.auteur and cree_le > now() - interval '1 minute') >= 20 then
    raise exception 'Trop de messages en peu de temps, patientez une minute';
  end if;
  return new;
end $$;
create trigger limiter_messages before insert on public.messages for each row execute function public.limiter_messages();

-- 4. Photos de profil : 2 Mo maximum, JPEG, PNG ou WebP seulement (pas de SVG)
update storage.buckets set file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'] where id = 'avatars';
