import { exigerStaff } from "@/lib/admin";
import { ajouterQuestion, supprimerQuestion } from "../actions";

export default async function Questions() {
  const { supabase } = await exigerStaff();
  const { data } = await supabase.from("questions").select("*").order("categorie");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Questions du QCM</h1>
      <form action={ajouterQuestion} className="mt-4 space-y-3 rounded-xl bg-white p-5">
        <select name="categorie" className="champ" aria-label="Catégorie">
          <option value="bible">Bible</option><option value="chretien">Culture chrétienne</option>
          <option value="jec">Histoire de la JEC</option><option value="culture">Culture générale</option>
        </select>
        <input name="enonce" required placeholder="Question" className="champ" />
        {[0, 1, 2, 3].map((n) => (
          <label key={n} className="flex items-center gap-2">
            <input type="radio" name="bonne" value={n} required aria-label={`Bonne réponse : choix ${n + 1}`} />
            <input name={`o${n}`} required placeholder={`Choix ${n + 1}`} className="champ" />
          </label>
        ))}
        <p className="text-sm text-slate-500">Cochez le bouton à côté de la bonne réponse.</p>
        <input name="explication" placeholder="Explication affichée après la partie (facultatif)" className="champ" />
        <button className="btn">Ajouter la question</button>
      </form>
      <h2 className="mt-8 text-xl font-semibold">{data?.length ?? 0} questions</h2>
      <ul className="mt-3 space-y-2">
        {(data ?? []).map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm">
            <span>[{q.categorie}] {q.enonce}</span>
            <form action={supprimerQuestion.bind(null, q.id)}><button className="text-red-700 underline">Supprimer</button></form>
          </li>
        ))}
      </ul>
    </main>
  );
}
