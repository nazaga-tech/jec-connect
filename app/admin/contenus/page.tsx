import { exigerStaff } from "@/lib/admin";
import { publier, supprimer } from "../actions";

const LIBELLES: Record<string, string> = { actualite: "Actualité", document: "Document", compte_rendu: "Compte rendu", opportunite: "Opportunité" };

export default async function Contenus() {
  const { supabase } = await exigerStaff();
  const { data } = await supabase.from("contenus").select("*").order("cree_le", { ascending: false });
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Publier un contenu</h1>
      <form action={publier} className="mt-4 space-y-3 rounded-xl bg-white p-5">
        <select name="type" className="champ" aria-label="Type">
          {Object.entries(LIBELLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input name="titre" required placeholder="Titre" className="champ" />
        <textarea name="corps" rows={4} placeholder="Texte (facultatif)" className="champ" />
        <input name="url" type="url" placeholder="Lien du fichier ou de la vidéo (facultatif)" className="champ" />
        <button className="btn">Publier</button>
      </form>
      <h2 className="mt-8 text-xl font-semibold">Déjà publié</h2>
      <ul className="mt-3 space-y-2">
        {(data ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg bg-white p-4">
            <span>{LIBELLES[c.type]} · {c.titre}</span>
            <form action={supprimer.bind(null, c.id)}><button className="text-red-700 underline">Supprimer</button></form>
          </li>
        ))}
      </ul>
    </main>
  );
}
