import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function exigerStaff(rolesOk = ["super_admin", "validateur", "moderateur"]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: moi } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!moi || !rolesOk.includes(moi.role)) redirect("/dashboard");
  return { supabase, role: moi.role as string, userId: user.id };
}
