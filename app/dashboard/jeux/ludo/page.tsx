import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { creerPartieLudo, rejoindreLudo } from "./actions";

type M = { id: string; joueur1: string; joueur2: string | null; statut: string; invite: string | null };
type Membre = { id: string; prenom: string; nom: string; surnom: string | null };

export default async function Lobby({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: matchs }, { data: membres }] = await Promise.all([
    supabase.from("matchs").select("*").eq("jeu", "ludo").neq("statut", "terminee").order("maj_le", { ascending: false }),
    supabase.rpc("annuaire"),
  ]);
  if (!membres) redirect("/dashboard");
  const nom = (id: string | null) => { const m = (membres as Membre[]).find((x) => x.id === id); return m ? (m.surnom || `${m.prenom} ${m.nom}`) : "…"; };
  const miens = ((matchs ?? []) as M[]).filter((m) => m.joueur1 === user.id || m.joueur2 === user.id);
  const ouverts = ((matchs ?? []) as M[]).filter((m) => m.statut === "attente" && m.joueur1 !== user.id);
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-4xl font-extrabold">Ludo</h1>
      <p className="text-sm text-slate-500">À deux joueurs, 4 pions chacun. Un 6 pour sortir un pion, un 6 (ou une capture) fait rejouer, arrivée exacte au centre. Victoire +30 points, défaite +5.</p>
      {erreur && <p role="alert" className="mt-3 text-red-600">Impossible de créer la partie : vous avez peut-être déjà 3 parties en attente (annulez-en une).</p>}
      <form action={creerPartieLudo} className="carte-ui mt-6 flex flex-wrap gap-2 p-4">
        <select name="invite" className="champ !w-auto flex-1" aria-label="Adversaire">
          <option value="">Partie ouverte à tous les membres</option>
          {(membres as Membre[]).filter((m) => m.id !== user.id).map((m) => <option key={m.id} value={m.id}>Inviter {m.prenom} {m.nom}</option>)}
        </select>
        <button className="btn">Créer une partie</button>
      </form>
      <h2 className="mt-8 text-xl font-bold">Mes parties</h2>
      <ul className="mt-3 space-y-2">
        {miens.length === 0 && <li className="text-slate-500">Aucune partie en cours.</li>}
        {miens.map((m) => (
          <li key={m.id} className="carte-ui flex items-center justify-between p-3">
            <span>{m.statut === "attente" ? "En attente d’un adversaire" : `Contre ${nom(m.joueur1 === user.id ? m.joueur2 : m.joueur1)}`}</span>
            <Link href={`/dashboard/jeux/ludo/${m.id}`} className="btn !py-1">Ouvrir</Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-bold">Parties à rejoindre</h2>
      <ul className="mt-3 space-y-2">
        {ouverts.length === 0 && <li className="text-slate-500">Aucune partie ouverte pour le moment.</li>}
        {ouverts.map((m) => (
          <li key={m.id} className="carte-ui flex items-center justify-between p-3">
            <span>{nom(m.joueur1)}{m.invite === user.id && <em className="text-ciel"> vous a invité</em>}</span>
            <form action={rejoindreLudo.bind(null, m.id)}><button className="btn-or !py-1">Jouer</button></form>
          </li>
        ))}
      </ul>
    </main>
  );
}
