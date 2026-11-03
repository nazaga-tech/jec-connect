import { exigerStaff } from "@/lib/admin";
import { JEC } from "@/lib/jec";
import { enregistrerApropos } from "../actions";

export default async function Apropos() {
  const { supabase } = await exigerStaff(["super_admin"]);
  const { data } = await supabase.from("reglages").select("cle,valeur").in("cle", ["apropos_intro", "apropos_ci"]);
  const v = (c: string, defaut: string) => data?.find((x) => x.cle === c)?.valeur ?? defaut;
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Textes de présentation de la JEC</h1>
      <p className="mt-1 text-slate-600">Ces textes s’affichent sur la page d’accueil. Complétez-les avec l’histoire officielle de la JEC en Côte d’Ivoire, sa devise, etc. Laissez un champ vide pour revenir au texte d’origine.</p>
      <form action={enregistrerApropos} className="carte-ui mt-6 space-y-4 p-5">
        <label className="block font-semibold">La JEC (présentation générale)
          <textarea name="apropos_intro" rows={5} maxLength={1500} defaultValue={v("apropos_intro", JEC.intro)} className="champ mt-1 font-normal" />
        </label>
        <label className="block font-semibold">La JEC en Côte d’Ivoire
          <textarea name="apropos_ci" rows={6} maxLength={1500} defaultValue={v("apropos_ci", JEC.ci)} className="champ mt-1 font-normal" />
        </label>
        <button className="btn">Enregistrer</button>
      </form>
    </main>
  );
}
