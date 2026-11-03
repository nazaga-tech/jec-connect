import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type M = { id: string; prenom: string; nom: string; surnom: string | null; categorie: string; annee_adhesion: number | null; section: string | null; profession: string | null; avatar_url: string | null };

export default async function Annuaire({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.rpc("annuaire");
  if (!data) redirect("/dashboard");
  const mot = q.trim().toLowerCase();
  const liste = (data as M[]).filter((m) => !mot ||
    [m.prenom, m.nom, m.surnom, m.section, m.profession, String(m.annee_adhesion ?? "")].some((v) => v?.toLowerCase().includes(mot)));
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Annuaire</h1>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Nom, surnom, année, section ou profession" className="champ" />
        <button className="btn">Rechercher</button>
      </form>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {liste.length === 0 && <li className="text-slate-500">Aucun membre trouvé.</li>}
        {liste.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            {m.avatar_url
              ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-nuit font-bold text-white">{m.prenom[0]}{m.nom[0]}</span>}
            <span>
              <strong>{m.prenom} {m.nom}</strong>{m.surnom && <> « {m.surnom} »</>}<br />
              <span className="text-sm text-slate-600">{m.categorie === "ancien" ? `Ancien · ${m.profession ?? ""}` : `En fonction · ${m.section ?? ""}`} · {m.annee_adhesion}</span>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
