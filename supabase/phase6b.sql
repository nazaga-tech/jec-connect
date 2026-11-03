-- JEC CONNECT phase 6b (jeu de dames en ligne) : à exécuter après phase6a.sql

create table public.matchs (
  id uuid primary key default gen_random_uuid(),
  jeu text not null default 'dames' check (jeu in ('dames','ludo')),
  joueur1 uuid not null references public.profiles(id) on delete cascade,
  joueur2 uuid references public.profiles(id) on delete cascade,
  invite uuid references public.profiles(id) on delete set null,
  statut text not null default 'attente' check (statut in ('attente','en_cours','terminee')),
  plateau text not null,
  tour int not null default 1,
  sans_prise int not null default 0,
  nb_coups int not null default 0,
  gagnant uuid references public.profiles(id) on delete set null,
  resultat text,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
alter table public.matchs enable row level security;
-- Lecture seule pour les membres. Tous les coups passent par le serveur (règles vérifiées dans lib/dames.ts).
create policy "voir mes parties et les parties ouvertes" on public.matchs for select using (
  public.est_approuve() and (joueur1 = auth.uid() or joueur2 = auth.uid()
    or (statut = 'attente' and (invite is null or invite = auth.uid()))));
alter publication supabase_realtime add table public.matchs;
