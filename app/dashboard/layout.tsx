import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import PhotoRequise from "./PhotoRequise";

// Barrière commune : photo obligatoire, puis accès réservé aux comptes approuvés.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("statut,avatar_url").eq("id", user.id).single();
  if (!p?.avatar_url) return <PhotoRequise id={user.id} />;
  if (p.statut !== "approuve") {
    const titre = p.statut === "refuse" ? "Compte refusé" : p.statut === "suspendu" ? "Compte suspendu" : "Compte en attente de validation";
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="carte-ui border-t-4 border-or p-8">
          <h1 className="text-2xl font-extrabold">{titre}</h1>
          <p className="mt-2 text-slate-600">{p.statut === "en_attente" ? "Merci ! Un responsable valide votre inscription très bientôt." : "Contactez un responsable de la JEC pour plus d’informations."}</p>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
