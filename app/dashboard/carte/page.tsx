import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Carte from "./Carte";

export default async function PageCarte() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!p || p.statut !== "approuve") redirect("/dashboard");
  return <Carte profil={p} />;
}
