import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Qcm from "./Qcm";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("profiles").select("statut").eq("id", user.id).single();
  if (data?.statut !== "approuve") redirect("/dashboard");
  return <Qcm />;
}
