import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { joursRestants } from "@/lib/dates";

type P = { id: string; prenom: string; surnom: string | null; date_naissance: string };

export default async function Notifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const depuis = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ data: actus }, { data: annivs }, { data: prives }] = await Promise.all([
    supabase.from("contenus").select("id,titre,cree_le").eq("type", "actualite").order("cree_le", { ascending: false }).limit(5),
    supabase.rpc("anniversaires"),
    supabase.from("messages").select("id").eq("destinataire", user.id).gte("cree_le", depuis),
  ]);
  const aujourdhui = ((annivs ?? []) as P[]).filter((p) => joursRestants(p.date_naissance) === 0);
  const nbPrives = prives?.length ?? 0;
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Notifications</h1>
      <ul className="mt-6 space-y-2">
        {aujourdhui.map((p) => (
          <li key={p.id} className="rounded-lg bg-or/25 p-4">🎂 C’est l’anniversaire de {p.surnom || p.prenom} aujourd’hui. <Link href="/dashboard/anniversaires" className="underline">Lui souhaiter</Link></li>
        ))}
        {nbPrives > 0 && <li className="rounded-lg bg-white p-4">✉️ {nbPrives} message(s) privé(s) cette semaine. <Link href="/dashboard/messages" className="underline">Ouvrir</Link></li>}
        {(actus ?? []).map((a) => <li key={a.id} className="rounded-lg bg-white p-4">📰 {a.titre} <span className="text-xs text-slate-500">{new Date(a.cree_le).toLocaleDateString("fr-FR")}</span></li>)}
        {!aujourdhui.length && !nbPrives && !actus?.length && <li className="text-slate-500">Aucune notification.</li>}
      </ul>
    </main>
  );
}
