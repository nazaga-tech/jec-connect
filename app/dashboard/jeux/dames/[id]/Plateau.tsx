"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { coupsLegaux, col, row, estRoi } from "@/lib/dames";
import { abandonner, jouer } from "../actions";

type Match = {
  id: string; joueur1: string; joueur2: string | null; invite: string | null; statut: string;
  plateau: string; tour: number; gagnant: string | null; resultat: string | null;
};

export default function Plateau({ initial, moi, noms }: { initial: Match; moi: string; noms: Record<string, string> }) {
  const supabase = useMemo(() => createClient(), []);
  const [m, setM] = useState<Match>(initial);
  const [sel, setSel] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");
  const joueur: 1 | 2 = moi === m.joueur1 ? 1 : 2;
  const flip = joueur === 2;

  const actualiser = useCallback(async () => {
    const { data } = await supabase.from("matchs").select("*").eq("id", initial.id).single();
    if (data) setM(data as Match);
  }, [supabase, initial.id]);

  useEffect(() => {
    const ch = supabase.channel(`dames-${initial.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matchs", filter: `id=eq.${initial.id}` },
        (p) => setM(p.new as Match)).subscribe();
    const t = setInterval(() => { if (m.statut !== "terminee") actualiser(); }, 3000); // secours si le temps réel est coupé
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [supabase, initial.id, m.statut, actualiser]);

  const monTour = m.statut === "en_cours" && m.tour === joueur;
  const legaux = useMemo(() => (monTour ? coupsLegaux(m.plateau, joueur) : []), [monTour, m.plateau, joueur]);
  const mobiles = new Set(legaux.map((c) => c.from));
  const cibles = new Set(legaux.filter((c) => c.from === sel).map((c) => c.path[c.path.length - 1]));

  async function clic(sq: number) {
    if (!monTour) return;
    if (mobiles.has(sq)) { setSel(sq); setErreur(""); return; }
    const coup = legaux.find((c) => c.from === sel && c.path[c.path.length - 1] === sq);
    setSel(null);
    if (!coup) return;
    const r = await jouer(m.id, coup);
    if (!r.ok) setErreur(r.erreur ?? "Coup refusé.");
    await actualiser();
  }

  const adversaire = noms[(joueur === 1 ? m.joueur2 : m.joueur1) ?? ""] ?? "…";
  let statut = "";
  if (m.statut === "attente") statut = m.invite ? `Invitation envoyée à ${noms[m.invite] ?? "un membre"}. En attente de sa réponse…` : "En attente d’un adversaire…";
  else if (m.statut === "en_cours") statut = monTour ? (legaux[0]?.captured.length ? "À vous de jouer : prise obligatoire" : "À vous de jouer") : `Tour de ${adversaire}…`;
  else statut = m.gagnant ? (m.gagnant === moi ? "Vous avez gagné !" : "Vous avez perdu.") + (m.resultat === "abandon" ? " (abandon)" : "") : "Partie nulle.";

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <p className="text-sm text-slate-600">Blancs : {noms[m.joueur1]} · Noirs : {m.joueur2 ? noms[m.joueur2] : "?"}</p>
      <h1 className="mt-1 font-serif text-2xl font-bold" role="status">{statut}</h1>
      {erreur && <p role="alert" className="text-sm text-red-600">{erreur}</p>}

      <div className="mt-4 grid aspect-square w-full grid-cols-10 overflow-hidden rounded-lg border-4 border-nuit">
        {Array.from({ length: 100 }, (_, k) => {
          const sq = flip ? 99 - k : k;
          const sombre = (row(sq) + col(sq)) % 2 === 1;
          const p = m.plateau[sq];
          const cliquable = sombre && monTour && (mobiles.has(sq) || cibles.has(sq));
          return (
            <button key={k} disabled={!cliquable} onClick={() => clic(sq)} aria-label={`case ${row(sq) + 1}-${col(sq) + 1}`}
              className={`relative flex items-center justify-center ${sombre ? "bg-[#8b5e3c]" : "bg-[#f0d9b5]"} ${sel === sq ? "ring-4 ring-inset ring-or" : ""}`}>
              {p !== " " && (
                <span className={`flex h-[80%] w-[80%] items-center justify-center rounded-full border-2 text-lg leading-none
                  ${p.toLowerCase() === "w" ? "border-slate-300 bg-white text-nuit" : "border-slate-600 bg-slate-900 text-or"}`}>
                  {estRoi(p) ? "♛" : ""}
                </span>
              )}
              {cibles.has(sq) && <span className="absolute h-3 w-3 rounded-full bg-or" />}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-2">
        {m.statut !== "terminee" && (
          <form action={abandonner.bind(null, m.id)}>
            <button className="rounded-lg border border-red-300 px-4 py-2 text-red-700">{m.statut === "attente" ? "Annuler la partie" : "Abandonner"}</button>
          </form>
        )}
        <Link href="/dashboard/jeux/dames" className="btn">Retour aux parties</Link>
      </div>
    </main>
  );
}
