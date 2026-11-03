import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Jeux() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: parties, error } = await supabase.from("parties").select("*").eq("statut", "terminee").order("fin_le", { ascending: false }).limit(10);
  if (error) redirect("/dashboard");
  const total = (parties ?? []).reduce((s, p) => s + p.points, 0);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Jeux</h1>
      <p className="text-sm text-slate-500">Les points sont uniquement virtuels : aucune mise, aucun retrait.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/jeux/qcm" className="rounded-xl bg-nuit p-6 text-white hover:ring-2 hover:ring-or">
          <h2 className="font-serif text-xl font-bold">QCM Bible et JEC</h2>
          <p className="mt-1 text-slate-200">5 questions, jusqu’à 70 points.</p>
        </Link>
        <Link href="/dashboard/jeux/classement" className="rounded-xl bg-white p-6 shadow-sm hover:ring-2 hover:ring-or">
          <h2 className="font-serif text-xl font-bold">Classements</h2>
          <p className="mt-1 text-slate-600">Du mois et général.</p>
        </Link>
        <Link href="/dashboard/jeux/dames" className="rounded-xl bg-white p-6 shadow-sm hover:ring-2 hover:ring-or">
          <h2 className="font-serif text-xl font-bold">Jeu de dames</h2>
          <p className="mt-1 text-slate-600">En ligne contre un autre jéciste.</p>
        </Link>
        <Link href="/dashboard/jeux/ludo" className="rounded-xl bg-white p-6 shadow-sm hover:ring-2 hover:ring-or">
          <h2 className="font-serif text-xl font-bold">Ludo</h2>
          <p className="mt-1 text-slate-600">À deux, avec dé et pions.</p>
        </Link>
      </div>
      <h2 className="mt-10 text-xl font-semibold">Mes dernières parties</h2>
      <ul className="mt-3 space-y-2">
        {(parties ?? []).length === 0 && <li className="text-slate-500">Aucune partie jouée. Lancez un QCM !</li>}
        {(parties ?? []).map((p) => (
          <li key={p.id} className="flex justify-between rounded-lg bg-white p-3 text-sm">
            <span>{p.jeu === "qcm" ? `QCM · ${p.score}/${p.total}` : p.jeu === "ludo" ? "Ludo" : "Dames"} · {new Date(p.fin_le).toLocaleDateString("fr-FR")}</span><strong>+{p.points} pts</strong>
          </li>
        ))}
      </ul>
      {(parties ?? []).length > 0 && <p className="mt-3 text-sm text-slate-600">Points sur ces parties : {total}</p>}
    </main>
  );
}
