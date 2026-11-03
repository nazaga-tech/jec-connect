"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { appliquer, coupsLegaux, estRoi, memeCoup, plateauInitial, type Move } from "@/lib/dames";

async function moi(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("statut").eq("id", user.id).single();
  if (p?.statut !== "approuve") redirect("/dashboard");
  return user.id;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function attribuerPoints(db: any, m: any, nbCoups: number, gagnant: string | null) {
  const depuis = new Date(Date.now() - 86400000).toISOString();
  for (const j of [m.joueur1, m.joueur2]) {
    const { count } = await db.from("parties").select("id", { count: "exact", head: true })
      .eq("joueur", j).eq("jeu", "dames").gte("fin_le", depuis);
    let pts = gagnant === null ? 10 : gagnant === j ? 30 : 5;
    if (nbCoups < 10 || (count ?? 0) >= 5) pts = 0; // anti-triche : parties trop courtes ou 5 parties/jour
    await db.from("parties").insert({ joueur: j, jeu: "dames", statut: "terminee", points: pts, fin_le: new Date().toISOString() });
  }
}

export async function creerPartie(formData: FormData): Promise<void> {
  const uid = await moi();
  let invite: string | null = String(formData.get("invite") || "") || null;
  if (invite === uid) invite = null;
  const { count } = await admin().from("matchs").select("id", { count: "exact", head: true }).eq("joueur1", uid).eq("statut", "attente");
  if ((count ?? 0) >= 3) redirect("/dashboard/jeux/dames?erreur=limite");
  const { data, error } = await admin().from("matchs").insert({ joueur1: uid, invite, plateau: plateauInitial() }).select("id").single();
  if (error || !data) redirect("/dashboard/jeux/dames?erreur=1");
  redirect(`/dashboard/jeux/dames/${data.id}`);
}

export async function rejoindre(id: string): Promise<void> {
  const uid = await moi();
  const db = admin();
  const { data: m } = await db.from("matchs").select("*").eq("id", id).single();
  if (m && m.statut === "attente" && m.joueur1 !== uid && (!m.invite || m.invite === uid)) {
    await db.from("matchs").update({ joueur2: uid, statut: "en_cours", maj_le: new Date().toISOString() }).eq("id", id).eq("statut", "attente");
  }
  redirect(`/dashboard/jeux/dames/${id}`);
}

export async function jouer(id: string, coup: Move): Promise<{ ok: boolean; erreur?: string }> {
  const uid = await moi();
  const db = admin();
  const { data: m } = await db.from("matchs").select("*").eq("id", id).single();
  if (!m || m.statut !== "en_cours") return { ok: false, erreur: "La partie est terminée." };
  const joueur = m.joueur1 === uid ? 1 : m.joueur2 === uid ? 2 : 0;
  if (!joueur || joueur !== m.tour) return { ok: false, erreur: "Ce n’est pas votre tour." };
  const legal = coupsLegaux(m.plateau, joueur).find((c) => memeCoup(c, coup));
  if (!legal) return { ok: false, erreur: "Coup illégal." };

  const plateau = appliquer(m.plateau, legal);
  const sans = legal.captured.length === 0 && estRoi(m.plateau[legal.from]) ? m.sans_prise + 1 : 0;
  const adversaire = joueur === 1 ? 2 : 1;
  const victoire = coupsLegaux(plateau, adversaire).length === 0;
  const nulle = !victoire && sans >= 50;
  const fin = victoire || nulle;
  const { data: maj } = await db.from("matchs").update({
    plateau, tour: adversaire, sans_prise: sans, nb_coups: m.nb_coups + 1, maj_le: new Date().toISOString(),
    ...(fin ? { statut: "terminee", gagnant: victoire ? uid : null, resultat: victoire ? "victoire" : "nulle" } : {}),
  }).eq("id", id).eq("nb_coups", m.nb_coups).select("id");
  if (!maj?.length) return { ok: false, erreur: "Position mise à jour, réessayez." };
  if (fin) await attribuerPoints(db, m, m.nb_coups + 1, victoire ? uid : null);
  return { ok: true };
}

export async function abandonner(id: string): Promise<void> {
  const uid = await moi();
  const db = admin();
  const { data: m } = await db.from("matchs").select("*").eq("id", id).single();
  if (!m || (m.joueur1 !== uid && m.joueur2 !== uid)) redirect("/dashboard/jeux/dames");
  if (m.statut === "attente") {
    await db.from("matchs").delete().eq("id", id);
    redirect("/dashboard/jeux/dames");
  }
  if (m.statut === "en_cours") {
    const gagnant = m.joueur1 === uid ? m.joueur2 : m.joueur1;
    const { data: maj } = await db.from("matchs").update({ statut: "terminee", gagnant, resultat: "abandon", maj_le: new Date().toISOString() })
      .eq("id", id).eq("statut", "en_cours").select("id");
    if (maj?.length) await attribuerPoints(db, m, m.nb_coups, gagnant);
  }
  redirect(`/dashboard/jeux/dames/${id}`);
}
