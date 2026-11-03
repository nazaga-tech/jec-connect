import { exigerStaff } from "@/lib/admin";
import { creerGroupe, supprimerMessage, approuver } from "../actions";

export default async function Moderation() {
  const { supabase, role } = await exigerStaff(["super_admin", "moderateur"]);
  const { data: groupes } = await supabase.from("groupes").select("*").order("nom");
  const { data: sigs } = await supabase.from("signalements").select("*").order("cree_le", { ascending: false }).limit(50);
  const ids = [...new Set((sigs ?? []).map((s) => s.cible))];
  const { data: profils } = ids.length ? await supabase.from("profiles").select("id,prenom,nom,matricule").in("id", ids) : { data: [] };
  const msgIds = (sigs ?? []).map((s) => s.message_id).filter(Boolean);
  const { data: msgs } = msgIds.length ? await supabase.from("messages").select("id,texte").in("id", msgIds) : { data: [] };
  const nom = (id: string) => { const p = profils?.find((x) => x.id === id); return p ? `${p.prenom} ${p.nom} (${p.matricule})` : id; };
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Modération</h1>
      <h2 className="mt-6 text-xl font-semibold">Groupes de discussion</h2>
      <form action={creerGroupe} className="mt-3 flex gap-2">
        <input name="nom" required placeholder="Nom du groupe (ex. Section Cocody, Génération 2015)" className="champ" />
        <select name="type" className="champ !w-auto" aria-label="Type"><option value="general">Général</option><option value="section">Section</option><option value="generation">Génération</option></select>
        <button className="btn">Créer</button>
      </form>
      <p className="mt-2 text-sm text-slate-600">{(groupes ?? []).map((g) => g.nom).join(" · ")}</p>
      <h2 className="mt-8 text-xl font-semibold">Signalements</h2>
      <ul className="mt-3 space-y-2">
        {(sigs ?? []).length === 0 && <li className="text-slate-500">Aucun signalement.</li>}
        {(sigs ?? []).map((s) => (
          <li key={s.id} className="rounded-lg bg-white p-4">
            <p className="font-semibold">{nom(s.cible)}</p>
            <p className="text-slate-700">« {msgs?.find((m) => m.id === s.message_id)?.texte ?? "Message supprimé"} »</p>
            <div className="mt-2 flex gap-2">
              {s.message_id && <form action={supprimerMessage.bind(null, s.message_id)}><button className="btn !py-1">Supprimer le message</button></form>}
              {role === "super_admin" && <form action={approuver.bind(null, s.cible, "suspendu")}><button className="rounded-lg border border-red-300 px-3 py-1 text-red-700">Suspendre le membre</button></form>}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
