-- JEC CONNECT phase 6 (QCM, points, classements) : à exécuter après phase5.sql

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  categorie text not null check (categorie in ('bible','chretien','jec','culture')),
  enonce text not null,
  options jsonb not null check (jsonb_array_length(options) = 4),
  bonne int not null check (bonne between 0 and 3),
  explication text,
  actif boolean not null default true
);
alter table public.questions enable row level security;
-- Les membres ne lisent JAMAIS cette table directement (les bonnes réponses y figurent).
create policy "staff lit questions" on public.questions for select using (public.mon_role() in ('super_admin','validateur','moderateur'));
create policy "staff ajoute questions" on public.questions for insert with check (public.mon_role() in ('super_admin','validateur','moderateur'));
create policy "staff supprime questions" on public.questions for delete using (public.mon_role() in ('super_admin','validateur','moderateur'));

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  joueur uuid not null references public.profiles(id) on delete cascade,
  jeu text not null default 'qcm' check (jeu in ('qcm','dames','ludo')),
  statut text not null default 'en_cours' check (statut in ('en_cours','terminee')),
  question_ids uuid[],
  score int, total int, points int not null default 0,
  cree_le timestamptz not null default now(), fin_le timestamptz
);
alter table public.parties enable row level security;
create policy "mes parties" on public.parties for select using (joueur = auth.uid());
-- Aucune politique d'écriture : seules les fonctions ci-dessous créent et terminent les parties.

create function public.qcm_tirer(p_categorie text default null, p_n int default 5)
returns table (partie_id uuid, id uuid, categorie text, enonce text, options jsonb)
language plpgsql security definer set search_path = public as $$
declare ids uuid[]; pid uuid;
begin
  if not public.est_approuve() then raise exception 'Accès refusé'; end if;
  if (select count(*) from public.parties x where x.joueur = auth.uid() and x.jeu = 'qcm' and x.cree_le > now() - interval '1 day') >= 10 then
    raise exception 'Limite de 10 parties par jour atteinte. Revenez demain !';
  end if;
  select array_agg(s.qid) into ids from (
    select qq.id as qid from public.questions qq
    where qq.actif and (p_categorie is null or qq.categorie = p_categorie)
    order by random() limit least(greatest(p_n, 1), 10)) s;
  if ids is null then raise exception 'Aucune question disponible dans cette catégorie'; end if;
  insert into public.parties (joueur, jeu, question_ids) values (auth.uid(), 'qcm', ids) returning parties.id into pid;
  return query select pid, q.id, q.categorie, q.enonce, q.options from public.questions q
    where q.id = any(ids) order by array_position(ids, q.id);
end $$;

-- p_reponses : {"<id question>": <index choisi>, ...}
create function public.qcm_corriger(p_partie uuid, p_reponses jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare pa public.parties; q record; ch int; ok int := 0; tot int; pts int; r jsonb := '[]';
begin
  select * into pa from public.parties x where x.id = p_partie and x.joueur = auth.uid() and x.statut = 'en_cours' for update;
  if not found then raise exception 'Partie introuvable ou déjà terminée'; end if;
  tot := array_length(pa.question_ids, 1);
  for q in select * from public.questions where id = any(pa.question_ids) loop
    ch := coalesce((p_reponses ->> q.id::text)::int, -1);
    if ch = q.bonne then ok := ok + 1; end if;
    r := r || jsonb_build_object('id', q.id, 'correct', ch = q.bonne, 'bonne', q.bonne, 'explication', q.explication);
  end loop;
  pts := ok * 10 + case when ok = tot then 20 else 0 end;
  update public.parties set statut = 'terminee', score = ok, total = tot, points = pts, fin_le = now() where id = p_partie;
  return jsonb_build_object('score', ok, 'total', tot, 'points', pts, 'detail', r);
end $$;

create function public.classement(p_periode text default 'mois')
returns table (joueur uuid, prenom text, surnom text, avatar_url text, points bigint, nb_parties bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.prenom, p.surnom, p.avatar_url, coalesce(sum(pt.points), 0)::bigint, count(pt.id)::bigint
  from public.profiles p
  join public.parties pt on pt.joueur = p.id and pt.statut = 'terminee'
    and (p_periode <> 'mois' or pt.fin_le >= date_trunc('month', now()))
  where p.statut = 'approuve' and public.est_approuve()
  group by p.id order by 5 desc, 6 desc limit 50
$$;

-- Questions de départ (ajoutez les vôtres dans /admin/questions)
insert into public.questions (categorie, enonce, options, bonne, explication) values
('bible','Combien de livres compte la Bible catholique ?','["66", "72", "73", "77"]'::jsonb,2,'46 livres pour l’Ancien Testament et 27 pour le Nouveau.'),
('bible','Quel est le premier livre de la Bible ?','["Exode", "Genèse", "Psaumes", "Matthieu"]'::jsonb,1,'La Genèse ouvre la Bible avec le récit de la création.'),
('bible','Qui a construit l’arche ?','["Moïse", "Abraham", "Noé", "Josué"]'::jsonb,2,'Noé a construit l’arche avant le déluge.'),
('bible','Qui a vaincu le géant Goliath ?','["Saül", "David", "Samson", "Gédéon"]'::jsonb,1,'David, jeune berger, a vaincu Goliath avec une fronde.'),
('bible','Dans quelle ville Jésus est-il né ?','["Nazareth", "Jérusalem", "Bethléem", "Capharnaüm"]'::jsonb,2,'Jésus est né à Bethléem.'),
('bible','Combien y avait-il d’apôtres choisis par Jésus ?','["7", "10", "12", "40"]'::jsonb,2,'Jésus a choisi douze apôtres.'),
('bible','Quel apôtre a trahi Jésus ?','["Pierre", "Jean", "Thomas", "Judas Iscariote"]'::jsonb,3,'Judas Iscariote a livré Jésus.'),
('bible','Qui fut jeté dans la fosse aux lions ?','["Daniel", "Jonas", "Élie", "Joseph"]'::jsonb,0,'Daniel a été protégé par Dieu dans la fosse aux lions.'),
('bible','Quel est le dernier livre de la Bible ?','["Actes des Apôtres", "Hébreux", "Apocalypse", "Jude"]'::jsonb,2,'L’Apocalypse clôt la Bible.'),
('bible','Qui fut le premier martyr chrétien ?','["Étienne", "Jacques", "Paul", "Barnabé"]'::jsonb,0,'Étienne fut lapidé (Actes 7).'),
('bible','Combien de jours Jésus a-t-il jeûné dans le désert ?','["7", "12", "30", "40"]'::jsonb,3,'Quarante jours et quarante nuits.'),
('bible','Dans quelle ville les disciples furent-ils appelés « chrétiens » pour la première fois ?','["Rome", "Antioche", "Corinthe", "Éphèse"]'::jsonb,1,'Actes 11,26.'),
('chretien','Que célèbre-t-on à Pâques ?','["La naissance de Jésus", "La Résurrection du Christ", "La Pentecôte", "L’Ascension"]'::jsonb,1,'Pâques est la fête de la Résurrection.'),
('chretien','Combien de sacrements compte l’Église catholique ?','["3", "5", "7", "12"]'::jsonb,2,'Baptême, confirmation, eucharistie, pénitence, onction des malades, ordre, mariage.'),
('chretien','Quel jour commence le Carême ?','["Le Vendredi saint", "Le Mercredi des Cendres", "Le Dimanche des Rameaux", "Le premier janvier"]'::jsonb,1,'Le Carême débute le Mercredi des Cendres.'),
('chretien','Quelle est la couleur liturgique du temps de l’Avent ?','["Violet", "Rouge", "Vert", "Noir"]'::jsonb,0,'Le violet exprime l’attente et la conversion.'),
('jec','Que signifie JEC ?','["Jeunesse Étudiante Chrétienne", "Jeunesse Évangélique Catholique", "Jeunes Enfants du Christ", "Jeunesse Écolière Catholique"]'::jsonb,0,'JEC : Jeunesse Étudiante Chrétienne.'),
('jec','Quelle est la méthode d’action de la révision de vie en Action catholique ?','["Prier, Lire, Servir", "Voir, Juger, Agir", "Écouter, Partager, Prier", "Apprendre, Aimer, Donner"]'::jsonb,1,'Voir, Juger, Agir.'),
('jec','Quel prêtre a popularisé la méthode « Voir, Juger, Agir » ?','["Joseph Cardijn", "Jean Bosco", "Vincent de Paul", "Pierre Teilhard"]'::jsonb,0,'Le cardinal Joseph Cardijn, fondateur de la JOC.'),
('culture','Quelle est la capitale économique de la Côte d’Ivoire ?','["Yamoussoukro", "Bouaké", "Abidjan", "San-Pédro"]'::jsonb,2,'Abidjan est la capitale économique ; Yamoussoukro est la capitale politique.'),
('culture','Quelle est la capitale politique de la Côte d’Ivoire ?','["Yamoussoukro", "Abidjan", "Korhogo", "Daloa"]'::jsonb,0,'Yamoussoukro est la capitale politique.'),
('culture','Quel est le plus grand océan du monde ?','["Atlantique", "Indien", "Arctique", "Pacifique"]'::jsonb,3,'L’océan Pacifique est le plus vaste.');
