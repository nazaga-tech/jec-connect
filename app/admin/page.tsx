import { exigerStaff } from "@/lib/admin";
import { approuver } from "./actions";
import { admin } from "@/lib/supabase/admin";

export default async function Admin() {
  const { supabase } = await exigerStaff(["super_admin", "validateur"]);
  const { data: attente } = await supabase.from("profiles").select("id,prenom,nom,categorie,annee_adhesion,profession,role_demande").eq("statut", "en_attente");
  const db = admin();
  const nb = async (t: string, f?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const q = db.from(t).select("id", { count: "exact", head: true }); const { count } = await (f ? f(q) : q); return count ?? 0;
  };
  const stats: [string, number][] = [
    ["Membres approuvés", await nb("profiles", (q) => q.eq("statut", "approuve"))],
    ["Jécistes actifs", await nb("profiles", (q) => q.eq("statut", "approuve").eq("categorie", "en_fonction"))],
    ["Anciens jécistes", await nb("profiles", (q) => q.eq("statut", "approuve").eq("categorie", "ancien"))],
    ["Messages envoyés", await nb("messages")],
    ["Parties jouées", await nb("parties", (q) => q.eq("statut", "terminee"))],
    ["À valider (contenus)", await nb("contenus", (q) => q.eq("statut", "en_attente"))],
  ];
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Tableau de bord</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(([t, n]) => <div key={t} className="carte-ui border-t-4 border-or p-4"><p className="font-serif text-3xl font-extrabold text-ciel">{n}</p><p className="text-xs text-slate-600">{t}</p></div>)}
      </div>
      <h2 className="mt-10 text-2xl font-extrabold">Inscriptions en attente</h2>
      <ul className="mt-4 space-y-2">
        {(attente ?? []).length === 0 && <li className="text-slate-500">Aucune demande en attente.</li>}
        {(attente ?? []).map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-4">
            <span>{m.prenom} {m.nom} · {m.categorie === "ancien" ? `Ancien (${m.profession ?? "—"})` : "Jéciste actif"} · {m.annee_adhesion}{m.role_demande === "respo" && <em className="ml-2 rounded bg-or/30 px-2 text-xs not-italic font-bold">demande : Respo Approbateur</em>}</span>
            <span className="flex gap-2">
              <form action={approuver.bind(null, m.id, "approuve")}><button className="btn !py-1">Approuver</button></form>
              <form action={approuver.bind(null, m.id, "refuse")}><button className="rounded-lg border border-red-300 px-3 py-1 text-red-700">Refuser</button></form>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
