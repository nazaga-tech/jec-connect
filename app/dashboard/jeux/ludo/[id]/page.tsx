import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rejoindreLudo } from "../actions";
import Tableau from "./Tableau";

type Membre = { id: string; prenom: string; nom: string; surnom: string | null };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: m }, { data: membres }] = await Promise.all([
    supabase.from("matchs").select("*").eq("id", id).eq("jeu", "ludo").single(),
    supabase.rpc("annuaire"),
  ]);
  if (!m || !membres) redirect("/dashboard/jeux/ludo");
  const noms = Object.fromEntries((membres as Membre[]).map((x) => [x.id, x.surnom || `${x.prenom} ${x.nom}`]));
  if (m.joueur1 !== user.id && m.joueur2 !== user.id) {
    if (m.statut !== "attente") redirect("/dashboard/jeux/ludo");
    return (
      <main className="mx-auto max-w-md px-4 py-14 text-center">
        <p className="text-lg">{noms[m.joueur1]} vous propose une partie de Ludo.</p>
        <form action={rejoindreLudo.bind(null, m.id)} className="mt-4"><button className="btn-or">Rejoindre la partie</button></form>
      </main>
    );
  }
  return <Tableau initial={m} moi={user.id} noms={noms} />;
}
