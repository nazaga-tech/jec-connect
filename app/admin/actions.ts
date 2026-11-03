"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lireVideo } from "@/lib/video";
import { admin } from "@/lib/supabase/admin";

// La sécurité réelle est assurée par les règles RLS et les triggers de la base.
export async function approuver(id: string, statut: "approuve" | "refuse" | "suspendu"): Promise<void> {
  const supabase = await createClient();
  await supabase.from("profiles").update({ statut }).eq("id", id);
  revalidatePath("/admin"); revalidatePath("/admin/membres");
}
export async function changerRole(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from("profiles").update({ role: String(formData.get("role")) }).eq("id", id);
  revalidatePath("/admin/membres");
}
export async function publier(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from("contenus").insert({
    type: String(formData.get("type")), titre: String(formData.get("titre")),
    corps: String(formData.get("corps") || "") || null,
    url: /^https?:\/\//i.test(String(formData.get("url") || "")) ? String(formData.get("url")) : null,
  });
  revalidatePath("/admin/contenus");
}
export async function supprimer(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("contenus").delete().eq("id", id);
  revalidatePath("/admin/contenus");
}

export async function creerGroupe(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from("groupes").insert({ nom: String(formData.get("nom")), type: String(formData.get("type")) });
  revalidatePath("/admin/moderation");
}
export async function supprimerMessage(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("messages").delete().eq("id", id);
  revalidatePath("/admin/moderation");
}

export async function ajouterQuestion(formData: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.from("questions").insert({
    categorie: String(formData.get("categorie")), enonce: String(formData.get("enonce")),
    options: [0, 1, 2, 3].map((n) => String(formData.get(`o${n}`))), bonne: Number(formData.get("bonne")),
    explication: String(formData.get("explication") || "") || null,
  });
  revalidatePath("/admin/questions");
}
export async function supprimerQuestion(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("questions").delete().eq("id", id);
  revalidatePath("/admin/questions");
}

export async function validerContenu(id: string, statut: "publie" | "refuse"): Promise<void> {
  const supabase = await createClient();
  await supabase.from("contenus").update({ statut }).eq("id", id);
  revalidatePath("/admin/validations");
}
export async function enregistrerVideo(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const url = String(formData.get("url") || "").trim();
  if (!url) await supabase.from("reglages").delete().eq("cle", "video_accueil");
  else if (lireVideo(url)) await supabase.from("reglages").upsert({ cle: "video_accueil", valeur: url, maj_le: new Date().toISOString() });
  revalidatePath("/"); revalidatePath("/admin/video");
}

export async function enregistrerApropos(formData: FormData): Promise<void> {
  const supabase = await createClient();
  for (const cle of ["apropos_intro", "apropos_ci"]) {
    const v = String(formData.get(cle) || "").trim().slice(0, 1500);
    if (!v) await supabase.from("reglages").delete().eq("cle", cle);
    else await supabase.from("reglages").upsert({ cle, valeur: v, maj_le: new Date().toISOString() });
  }
  revalidatePath("/"); revalidatePath("/admin/apropos");
}

export async function supprimerMembre(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id === id) return;
  const { data: moi } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (moi?.role !== "super_admin") return; // seul le super administrateur supprime un compte
  await admin().auth.admin.deleteUser(id);
  revalidatePath("/admin/membres");
}
