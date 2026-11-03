"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deconnexion(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
