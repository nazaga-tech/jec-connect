import { exigerStaff } from "@/lib/admin";
import { validerContenu } from "../actions";

const LIB: Record<string, string> = { document: "Document", compte_rendu: "Compte rendu", opportunite: "Offre" };

export default async function Validations() {
  const { supabase } = await exigerStaff(["super_admin", "validateur"]);
  const { data } = await supabase.from("contenus").select("*").eq("statut", "en_attente").order("cree_le");
  const ids = [...new Set((data ?? []).map((c) => c.auteur))];
  const { data: profils } = ids.length ? await supabase.from("profiles").select("id,prenom,nom,categorie").in("id", ids) : { data: [] };
  const nom = (id: string) => { const p = profils?.find((x) => x.id === id); return p ? `${p.prenom} ${p.nom}` : "Membre"; };
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Contenus à valider</h1>
      <ul className="mt-6 space-y-3">
        {(data ?? []).length === 0 && <li className="text-slate-500">Rien à valider.</li>}
        {(data ?? []).map((c) => (
          <li key={c.id} className="carte-ui p-5">
            <p className="text-xs font-bold uppercase text-ciel">{LIB[c.type] ?? c.type} · proposé par {nom(c.auteur)}</p>
            <h2 className="text-lg font-bold">{c.titre}</h2>
            {c.corps && <p className="mt-1 text-slate-700">{c.corps}</p>}
            {c.url && /^https?:\/\//i.test(c.url) && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm text-ciel underline">{c.url}</a>}
            <div className="mt-3 flex gap-2">
              <form action={validerContenu.bind(null, c.id, "publie")}><button className="btn !py-1">Publier</button></form>
              <form action={validerContenu.bind(null, c.id, "refuse")}><button className="rounded-xl border border-red-300 px-4 py-1 text-red-700">Refuser</button></form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
