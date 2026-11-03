"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { absCase, DEPART, pionsJouables, SURES, type Etat } from "@/lib/ludo";
import Confirmer from "@/components/Confirmer";
import { abandonnerLudo, deplacer, lancer } from "../actions";

type Match = { id: string; joueur1: string; joueur2: string | null; invite: string | null; statut: string; plateau: string; tour: number; gagnant: string | null; resultat: string | null };
const COULEUR = ["#2f6fb5", "#e8a824"];
const C = 230, R = 160;
const ang = (a: number) => (a / 52) * 2 * Math.PI - Math.PI / 2;
const xy = (a: number, r: number): [number, number] => [C + r * Math.cos(ang(a)), C + r * Math.sin(ang(a))];

function position(j: 1 | 2, p: number, i: number): [number, number] {
  if (p === -1) { const [bx, by] = xy(DEPART[j - 1], R + 50); return [bx + (i % 2 ? 15 : -15), by + (i < 2 ? -15 : 15)]; }
  if (p <= 50) return xy(absCase(j, p), R);
  return xy(absCase(j, 50), p === 56 ? 16 + i * 4 : R - 22 * (p - 50));
}

export default function Tableau({ initial, moi, noms }: { initial: Match; moi: string; noms: Record<string, string> }) {
  const supabase = useMemo(() => createClient(), []);
  const [m, setM] = useState<Match>(initial);
  const [erreur, setErreur] = useState("");
  const joueur: 1 | 2 = moi === m.joueur1 ? 1 : 2;
  const e: Etat = useMemo(() => JSON.parse(m.plateau), [m.plateau]);

  const actualiser = useCallback(async () => {
    const { data } = await supabase.from("matchs").select("*").eq("id", initial.id).single();
    if (data) setM(data as Match);
  }, [supabase, initial.id]);

  useEffect(() => {
    const ch = supabase.channel(`ludo-${initial.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matchs", filter: `id=eq.${initial.id}` }, (p) => setM(p.new as Match)).subscribe();
    const t = setInterval(() => { if (m.statut !== "terminee") actualiser(); }, 3000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [supabase, initial.id, m.statut, actualiser]);

  const monTour = m.statut === "en_cours" && m.tour === joueur;
  const jouables = monTour && e.de !== null ? pionsJouables(e, joueur, e.de) : [];
  async function agir(f: () => Promise<{ ok: boolean; erreur?: string }>) {
    const r = await f(); setErreur(r.ok ? "" : r.erreur ?? "Action refusée."); await actualiser();
  }

  const adversaire = noms[(joueur === 1 ? m.joueur2 : m.joueur1) ?? ""] ?? "…";
  let statut = "";
  if (m.statut === "attente") statut = m.invite ? `Invitation envoyée à ${noms[m.invite] ?? "un membre"}…` : "En attente d’un adversaire…";
  else if (m.statut === "en_cours") statut = monTour ? (e.de === null ? "À vous : lancez le dé" : "Choisissez un pion à déplacer") : `Tour de ${adversaire}…`;
  else statut = (m.gagnant === moi ? "Vous avez gagné !" : "Vous avez perdu.") + (m.resultat === "abandon" ? " (abandon)" : "");
  const face = (v: number) => "⚀⚁⚂⚃⚄⚅"[v - 1];

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <p className="text-sm text-slate-600"><span style={{ color: COULEUR[0] }}>●</span> {noms[m.joueur1]} · <span style={{ color: COULEUR[1] }}>●</span> {m.joueur2 ? noms[m.joueur2] : "?"}</p>
      <h1 className="mt-1 text-2xl font-extrabold" role="status">{statut}</h1>
      {e.dernier && <p className="text-sm text-slate-500">Dernier lancer : {noms[e.dernier.j === 1 ? m.joueur1 : m.joueur2 ?? ""]} a fait {e.dernier.v}</p>}
      {erreur && <p role="alert" className="text-sm text-red-600">{erreur}</p>}

      <svg viewBox="0 0 460 460" className="mt-3 w-full rounded-2xl bg-white shadow-[0_8px_30px_rgba(11,26,58,.07)] ring-1 ring-black/5" role="img" aria-label="Plateau de Ludo">
        <circle cx={C} cy={C} r={R + 22} fill="#f8f5ef" />
        {[1, 2].map((j) => { const [bx, by] = xy(DEPART[j - 1], R + 50); return <circle key={j} cx={bx} cy={by} r={34} fill={COULEUR[j - 1]} opacity={0.18} />; })}
        {[1, 2].map((j) => [51, 52, 53, 54, 55].map((k) => { const [x, y] = position(j as 1 | 2, k, 0); return <circle key={`${j}${k}`} cx={x} cy={y} r={8} fill={COULEUR[j - 1]} opacity={0.35} />; }))}
        {Array.from({ length: 52 }, (_, a) => {
          const [x, y] = xy(a, R);
          const depart = DEPART.indexOf(a);
          return <circle key={a} cx={x} cy={y} r={9} fill={depart >= 0 ? COULEUR[depart] : "#fff"} stroke={SURES.has(a) ? "#e8a824" : "#cbd5e1"} strokeWidth={SURES.has(a) ? 3 : 1.5} />;
        })}
        <circle cx={C} cy={C} r={24} fill="#0b1a3a" />
        <text x={C} y={C + 5} textAnchor="middle" fill="#e8a824" fontSize="13" fontWeight="800">JEC</text>
        {([1, 2] as const).map((j) => e.p[j - 1].map((p, i) => {
          const [x, y] = position(j, p, i);
          const peut = j === joueur && jouables.includes(i);
          return (
            <g key={`${j}-${i}`} onClick={peut ? () => agir(() => deplacer(m.id, i)) : undefined}
              onKeyDown={peut ? (ev) => { if (ev.key === "Enter") agir(() => deplacer(m.id, i)); } : undefined}
              role={peut ? "button" : undefined} tabIndex={peut ? 0 : undefined} aria-label={peut ? `Déplacer le pion ${i + 1}` : undefined} style={{ cursor: peut ? "pointer" : "default" }}>
              {peut && <circle cx={x} cy={y} r={17} fill="none" stroke="#e8a824" strokeWidth={3}><animate attributeName="r" values="14;19;14" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={x} cy={y} r={11} fill={COULEUR[j - 1]} stroke="#fff" strokeWidth={2.5} />
              <circle cx={x} cy={y} r={4} fill="#fff" opacity={0.6} />
            </g>
          );
        }))}
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {monTour && e.de === null && <button onClick={() => agir(() => lancer(m.id))} className="btn-or !px-8 !py-3 text-lg">🎲 Lancer le dé</button>}
        {e.de !== null && <span className="text-6xl" aria-label={`Dé : ${e.de}`}>{face(e.de)}</span>}
        {m.statut !== "terminee" && <Confirmer action={abandonnerLudo.bind(null, m.id)} message={m.statut === "attente" ? "Annuler cette partie ?" : "Abandonner la partie ?"} className="rounded-xl border border-red-300 px-4 py-2 text-red-700">{m.statut === "attente" ? "Annuler" : "Abandonner"}</Confirmer>}
        <Link href="/dashboard/jeux/ludo" className="btn">Retour aux parties</Link>
      </div>
    </main>
  );
}
