import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Reçoit les liens des e-mails (confirmation d'inscription, mot de passe oublié).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const sur = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/login`);
  }
  return NextResponse.redirect(`${origin}${sur}`);
}
