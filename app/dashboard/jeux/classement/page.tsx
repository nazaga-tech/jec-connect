import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type L = { joueur: string; prenom: string; surnom: string | null; avatar_url: string | null; points: number; nb_parties: number };

export default async function Classement({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p = "mois" } = await searchParams;
  const periode = p === "total" ? "total" : "mois";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.rpc("classement", { p_periode: periode });
  if (!data) redirect("/dashboard");
  const onglet = (v: string, l: string) => (
    <Link href={`?p=${v}`} className={`rounded-lg px-4 py-1.5 ${periode === v ? "bg-nuit text-white" : "bg-white"}`}>{l}</Link>
  );
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Classement</h1>
      <div className="mt-4 flex gap-2">{onglet("mois", "Ce mois-ci")}{onglet("total", "Général")}</div>
      <ol className="mt-6 space-y-2">
        {(data as L[]).length === 0 && <li className="text-slate-500">Personne n’a encore joué. Soyez le premier !</li>}
        {(data as L[]).map((j, r) => (
          <li key={j.joueur} className={`flex items-center justify-between rounded-lg p-3 ${j.joueur === user.id ? "bg-or/25" : "bg-white"}`}>
            <span><strong className="mr-3 inline-block w-6">{r + 1}</strong>{j.surnom || j.prenom}</span>
            <span>{j.points} pts <span className="text-xs text-slate-500">({j.nb_parties} parties)</span></span>
          </li>
        ))}
      </ol>
    </main>
  );
}
