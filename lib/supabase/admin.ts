import { createClient } from "@supabase/supabase-js";

// Client à droits complets : à utiliser UNIQUEMENT dans des actions serveur, jamais côté navigateur.
export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
