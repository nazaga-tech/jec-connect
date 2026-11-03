import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TYPES } from "@/lib/rubriques";
import { proposer } from "../actions";

export default async function Rubrique({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const rub = TYPES[type];
  if (!rub) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("contenus").select("*").eq("type", rub.type).neq("statut", "refuse").order("cree_le", { ascending: false });
  const peutProposer = rub.type !== "actualite";
  const mediatheque = type === "documents" || type === "comptes-rendus";
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-extrabold">{mediatheque ? "Médiathèque" : rub.titre}</h1>
      {mediatheque && (
        <div className="mt-4 flex gap-2">
          {[["documents", "Documents"], ["comptes-rendus", "Comptes rendus"]].map(([s, l]) => (
            <Link key={s} href={`/dashboard/${s}`} className={`rounded-full px-5 py-1.5 font-semibold ${type === s ? "bg-nuit text-white" : "bg-white ring-1 ring-black/10"}`}>{l}</Link>
          ))}
        </div>
      )}
      {peutProposer && (
        <details className="carte-ui mt-6 p-5">
          <summary className="cursor-pointer font-bold text-ciel">+ Proposer {rub.type === "opportunite" ? "une offre" : rub.type === "compte_rendu" ? "un compte rendu" : "un document"}</summary>
          <form action={proposer.bind(null, rub.type)} className="mt-4 space-y-3">
            <input name="titre" required placeholder="Titre" className="champ" />
            <textarea name="corps" rows={3} placeholder="Description" className="champ" />
            <input name="url" type="url" placeholder="Lien (Google Drive, site de l’offre…)" className="champ" />
            <button className="btn">Envoyer</button>
            <p className="text-sm text-slate-500">
              {rub.type === "opportunite" ? "Offre d’un ancien jéciste ou d’un responsable : en ligne directement, avec le badge Vérifié. Offre d’un jéciste actif : validée sous 12 h maximum." : "Votre ajout sera visible par tous après validation par un responsable."}
            </p>
          </form>
        </details>
      )}
      <ul className="mt-6 space-y-3">
        {(data ?? []).length === 0 && <li className="text-slate-500">Rien de publié pour le moment.</li>}
        {(data ?? []).map((c) => (
          <li key={c.id} className="carte-ui p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{c.titre}</h2>
              {c.verifie && <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">✓ Vérifié</span>}
              {c.statut === "en_attente" && <span className="rounded-full bg-or/30 px-2.5 py-0.5 text-xs font-bold">En attente de validation</span>}
            </div>
            <p className="text-xs text-slate-500">{new Date(c.cree_le).toLocaleDateString("fr-FR")}</p>
            {c.corps && <p className="mt-2 whitespace-pre-line text-slate-700">{c.corps}</p>}
            {c.url && /^https?:\/\//i.test(c.url) && <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn mt-3 !py-1.5 text-sm">Ouvrir</a>}
          </li>
        ))}
      </ul>
    </main>
  );
}
