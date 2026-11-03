"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Q = { partie_id: string; id: string; categorie: string; enonce: string; options: string[] };
type Detail = { id: string; correct: boolean; bonne: number; explication: string | null };
type Resultat = { score: number; total: number; points: number; detail: Detail[] };

const CATS = [["", "Toutes les catégories"], ["bible", "Bible"], ["chretien", "Culture chrétienne"], ["jec", "Histoire de la JEC"], ["culture", "Culture générale"]];

export default function Qcm() {
  const supabase = createClient();
  const [cat, setCat] = useState("");
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [rep, setRep] = useState<Record<string, number>>({});
  const [res, setRes] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState("");

  async function demarrer() {
    setErreur(""); setRes(null); setRep({}); setI(0);
    const { data, error } = await supabase.rpc("qcm_tirer", { p_categorie: cat || null, p_n: 5 });
    if (error) return setErreur(error.message);
    setQs(data as Q[]);
  }
  async function choisir(q: Q, idx: number) {
    const suite = { ...rep, [q.id]: idx };
    setRep(suite);
    if (i + 1 < qs.length) return setI(i + 1);
    const { data, error } = await supabase.rpc("qcm_corriger", { p_partie: q.partie_id, p_reponses: suite });
    if (error) return setErreur(error.message);
    setRes(data as Resultat);
  }

  if (res) return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">{res.score} / {res.total} · +{res.points} points</h1>
      {res.score === res.total && <p className="mt-1 text-or">Sans faute : bonus de 20 points !</p>}
      <ol className="mt-6 space-y-3">
        {qs.map((q) => {
          const d = res.detail.find((x) => x.id === q.id)!;
          return (
            <li key={q.id} className={`rounded-lg p-4 ${d.correct ? "bg-green-100" : "bg-red-100"}`}>
              <p className="font-semibold">{q.enonce}</p>
              <p className="text-sm">{d.correct ? "Bonne réponse" : `Votre réponse : ${q.options[rep[q.id]] ?? "aucune"}`} · Réponse : {q.options[d.bonne]}</p>
              {d.explication && <p className="mt-1 text-sm text-slate-700">{d.explication}</p>}
            </li>
          );
        })}
      </ol>
      <div className="mt-6 flex gap-2">
        <button onClick={() => { setQs([]); setRes(null); }} className="btn">Rejouer</button>
        <Link href="/dashboard/jeux/classement" className="btn-or">Voir le classement</Link>
      </div>
    </main>
  );

  if (qs.length === 0) return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">QCM Bible et JEC</h1>
      <p className="mt-2 text-slate-600">5 questions. 10 points par bonne réponse, +20 points si vous ne faites aucune faute.</p>
      <select value={cat} onChange={(e) => setCat(e.target.value)} className="champ mt-5" aria-label="Catégorie">
        {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {erreur && <p role="alert" className="mt-3 text-sm text-red-600">{erreur}</p>}
      <button onClick={demarrer} className="btn mt-4 w-full">Commencer</button>
    </main>
  );

  const q = qs[i];
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-sm text-slate-500">Question {i + 1} sur {qs.length}</p>
      <h1 className="mt-1 font-serif text-2xl font-bold">{q.enonce}</h1>
      <div className="mt-5 space-y-2">
        {q.options.map((o, idx) => (
          <button key={idx} onClick={() => choisir(q, idx)} className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-left hover:border-ciel hover:bg-ciel/10">{o}</button>
        ))}
      </div>
      {erreur && <p role="alert" className="mt-3 text-sm text-red-600">{erreur}</p>}
    </main>
  );
}
