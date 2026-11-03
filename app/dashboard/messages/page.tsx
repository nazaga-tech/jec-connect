import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Messagerie from "./Messagerie";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: groupes }, { data: membres }, { data: bloques }] = await Promise.all([
    supabase.from("groupes").select("id,nom").order("nom"),
    supabase.rpc("annuaire"),
    supabase.from("blocages").select("bloque"),
  ]);
  if (!membres) redirect("/dashboard");
  return <Messagerie moi={user.id} groupes={groupes ?? []} membres={membres} bloquesInit={(bloques ?? []).map((b) => b.bloque)} />;
}
