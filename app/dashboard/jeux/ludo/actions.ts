"use server";
import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { etatInitial, jouerPion, pionsJouables, type Etat } from "@/lib/ludo";

async function moi(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("statut").eq("id", user.id).single();
  if (p?.statut !== "approuve") redirect("/dashboard");
  return user.id;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function attribuerPoints(db: any, m: any, nbCoups: number, gagnant: string) {
  const depuis = new Date(Date.now() - 86400000).toISOString();
  for (const j of [m.joueur1, m.joueur2]) {
    const { count } = await db.from("parties").select("id", { count: "exact", head: true }).eq("joueur", j).eq("jeu", "ludo").gte("fin_le", depuis);
    let pts = gagnant === j ? 30 : 5;
    if (nbCoups < 10 || (count ?? 0) >= 5) pts = 0; // anti-triche
    await db.from("parties").insert({ joueur: j, jeu: "ludo", statut: "terminee", points: pts, fin_le: new Date().toISOString() });
  }
}

export async function creerPartieLudo(formData: FormData): Promise<void> {
  const uid = await moi();
  let invite: string | null = String(formData.get("invite") || "") || null;
  if (invite === uid) invite = null;
  const { count } = await admin().from("matchs").select("id", { count: "exact", head: true }).eq("joueur1", uid).eq("statut", "attente");
  if ((count ?? 0) >= 3) redirect("/dashboard/jeux/ludo?erreur=limite");
  const { data, error } = await admin().from("matchs").insert({ jeu: "ludo", joueur1: uid, invite, plateau: JSON.stringify(etatInitial()) }).select("id").single();
  if (error || !data) redirect("/dashboard/jeux/ludo?erreur=1");
  redirect(`/dashboard/jeux/ludo/${data.id}`);
}

export async function rejoindreLudo(id: string): Promise<void> {
  const uid = await moi();
  const db = admin();
  const { data: m } = await db.from("matchs").select("*").eq("id", id).single();
  if (m && m.jeu === "ludo" && m.statut === "attente" && m.joueur1 !== uid && (!m.invite || m.invite === uid)) {
    await db.from("matchs").update({ joueur2: uid, statut: "en_cours", maj_le: new Date().toISOString() }).eq("id", id).eq("statut", "attente");
  }
  redirect(`/dashboard/jeux/ludo/${id}`);
}

async function charger(id: string) {
  const uid = await moi();
  const db = admin();
  const { data: m } = await db.from("matchs").select("*").eq("id", id).single();
  if (!m || m.jeu !== "ludo" || m.statut !== "en_cours") return { uid, db, m: null as any, joueur: 0 as 0 | 1 | 2 };
  const joueur = (m.joueur1 === uid ? 1 : m.joueur2 === uid ? 2 : 0) as 0 | 1 | 2;
  return { uid, db, m, joueur };
}

export async function lancer(id: string): Promise<{ ok: boolean; erreur?: string }> {
  const { db, m, joueur } = await charger(id);
  if (!m) return { ok: false, erreur: "La partie est terminée." };
  if (!joueur || joueur !== m.tour) return { ok: false, erreur: "Ce n’est pas votre tour." };
  const e: Etat = JSON.parse(m.plateau);
  if (e.de !== null) return { ok: false, erreur: "Déplacez d’abord un pion." };
  const v = randomInt(1, 7); // dé tiré sur le serveur
  const adversaire = joueur === 1 ? 2 : 1;
  const base = { nb_coups: m.nb_coups + 1, maj_le: new Date().toISOString() };
  e.dernier = { j: joueur, v };
  const maj = pionsJouables(e, joueur, v).length === 0
    ? { ...base, plateau: JSON.stringify({ ...e, de: null }), tour: adversaire }
    : { ...base, plateau: JSON.stringify({ ...e, de: v }) };
  const { data } = await db.from("matchs").update(maj).eq("id", id).eq("nb_coups", m.nb_coups).select("id");
  return data?.length ? { ok: true } : { ok: false, erreur: "Position mise à jour, réessayez." };
}

export async function deplacer(id: string, pion: number): Promise<{ ok: boolean; erreur?: string }> {
  const { uid, db, m, joueur } = await charger(id);
  if (!m) return { ok: false, erreur: "La partie est terminée." };
  if (!joueur || joueur !== m.tour) return { ok: false, erreur: "Ce n’est pas votre tour." };
  const e: Etat = JSON.parse(m.plateau);
  if (e.de === null || !pionsJouables(e, joueur, e.de).includes(pion)) return { ok: false, erreur: "Déplacement impossible." };
  const r = jouerPion(e, joueur, pion, e.de);
  const adversaire = joueur === 1 ? 2 : 1;
  const { data } = await db.from("matchs").update({
    plateau: JSON.stringify(r.etat), nb_coups: m.nb_coups + 1, maj_le: new Date().toISOString(),
    tour: r.gagne || r.rejoue ? joueur : adversaire,
    ...(r.gagne ? { statut: "terminee", gagnant: uid, resultat: "victoire" } : {}),
  }).eq("id", id).eq("nb_coups", m.nb_coups).select("id");
  if (!data?.length) return { ok: false, erreur: "Position mise à jour, réessayez." };
  if (r.gagne) await attribuerPoints(db, m, m.nb_coups + 1, uid);
  return { ok: true };
}

export async function abandonnerLudo(id: string): Promise<void> {
  const uid = await moi();
  const db = admin();
  const { data: m } = await db.from("matchs").select("*").eq("id", id).single();
  if (!m || (m.joueur1 !== uid && m.joueur2 !== uid)) redirect("/dashboard/jeux/ludo");
  if (m.statut === "attente") { await db.from("matchs").delete().eq("id", id); redirect("/dashboard/jeux/ludo"); }
  if (m.statut === "en_cours") {
    const gagnant = m.joueur1 === uid ? m.joueur2 : m.joueur1;
    const { data: maj } = await db.from("matchs").update({ statut: "terminee", gagnant, resultat: "abandon", maj_le: new Date().toISOString() }).eq("id", id).eq("statut", "en_cours").select("id");
    if (maj?.length) await attribuerPoints(db, m, m.nb_coups, gagnant);
  }
  redirect(`/dashboard/jeux/ludo/${id}`);
}
