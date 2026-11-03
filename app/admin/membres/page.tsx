import { exigerStaff } from "@/lib/admin";
import { approuver, changerRole, supprimerMembre } from "../actions";
import Confirmer from "@/components/Confirmer";

export default async function Membres() {
  const { supabase, role, userId } = await exigerStaff();
  const { data } = await supabase.from("profiles").select("id,matricule,prenom,nom,statut,role,categorie").neq("statut", "en_attente").order("nom");
  const superAdmin = role === "super_admin";
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Membres</h1>
      <ul className="mt-4 space-y-2">
        {(data ?? []).map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-4">
            <span>{m.matricule} · {m.prenom} {m.nom} · <em>{m.statut}</em></span>
            <span className="flex flex-wrap items-center gap-2">
              {superAdmin && (
                <form action={changerRole.bind(null, m.id)} className="flex gap-1">
                  <select name="role" defaultValue={m.role} className="champ !w-auto !py-1" aria-label="Rôle">
                    <option value="membre">Membre</option><option value="moderateur">Modérateur</option>
                    <option value="validateur">Validateur</option><option value="super_admin">Super admin</option>
                  </select>
                  <button className="btn !py-1">OK</button>
                </form>
              )}
              {role !== "moderateur" && (m.statut === "suspendu"
                ? <form action={approuver.bind(null, m.id, "approuve")}><button className="btn !py-1">Réactiver</button></form>
                : <form action={approuver.bind(null, m.id, "suspendu")}><button className="rounded-lg border border-red-300 px-3 py-1 text-red-700">Suspendre</button></form>)}
              {superAdmin && m.id !== userId && <Confirmer action={supprimerMembre.bind(null, m.id)} message={`Supprimer définitivement ${m.prenom} ${m.nom} et toutes ses données ?`} className="rounded-xl bg-red-700 px-3 py-1 text-white">Supprimer</Confirmer>}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
