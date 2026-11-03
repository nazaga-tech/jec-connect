import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { souhaiter } from "../actions";
import { joursRestants } from "@/lib/dates";

type P = { id: string; prenom: string; surnom: string | null; date_naissance: string };

export default async function Anniversaires() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.rpc("anniversaires");
  if (!data) redirect("/dashboard");
  const liste = (data as P[]).map((p) => ({ ...p, j: joursRestants(p.date_naissance) })).filter((p) => p.j <= 60).sort((a, b) => a.j - b.j);
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Anniversaires</h1>
      <p className="text-sm text-slate-500">Seuls les membres qui ont choisi de rendre leur date visible apparaissent ici.</p>
      <ul className="mt-6 space-y-2">
        {liste.length === 0 && <li className="text-slate-500">Aucun anniversaire dans les 60 prochains jours.</li>}
        {liste.map((p) => (
          <li key={p.id} className={`flex items-center justify-between rounded-lg p-4 ${p.j === 0 ? "bg-or/25" : "bg-white"}`}>
            <span>{p.surnom || p.prenom} · {new Date(p.date_naissance).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" })}
              {" "}<em className="text-slate-500">{p.j === 0 ? "aujourd’hui" : p.j === 1 ? "demain" : `dans ${p.j} jours`}</em></span>
            {p.id !== user.id && <form action={souhaiter.bind(null, p.id)}><button className="btn !py-1">Souhaiter</button></form>}
          </li>
        ))}
      </ul>
    </main>
  );
}
