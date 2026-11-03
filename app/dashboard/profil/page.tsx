import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilForm from "./ProfilForm";

export default async function Profil() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!p || p.statut !== "approuve") redirect("/dashboard");
  return <ProfilForm profil={p} />;
}
