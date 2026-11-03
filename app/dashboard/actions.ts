"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function souhaiter(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("messages").insert({ destinataire: id, texte: "Joyeux anniversaire ! 🎂 Que Dieu te bénisse." });
  revalidatePath("/dashboard/anniversaires");
}

export async function proposer(type: string, formData: FormData): Promise<void> {
  if (!["document", "compte_rendu", "opportunite"].includes(type)) return;
  const url = String(formData.get("url") || "");
  const supabase = await createClient();
  // Le statut (publié / en attente) et le badge « Vérifié » sont décidés par la base, pas par le navigateur.
  await supabase.from("contenus").insert({
    type, titre: String(formData.get("titre")), corps: String(formData.get("corps") || "") || null,
    url: /^https?:\/\//i.test(url) ? url : null,
  });
  revalidatePath("/dashboard", "layout");
}
