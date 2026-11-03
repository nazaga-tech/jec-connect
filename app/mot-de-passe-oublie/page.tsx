"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Oubli() {
  const [envoye, setEnvoye] = useState(false);
  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/nouveau-mot-de-passe` });
    setEnvoye(true); // même message dans tous les cas : on ne révèle pas si l'adresse existe
  }
  return (
    <main className="mx-auto max-w-sm px-4 py-14">
      <h1 className="font-serif text-3xl font-bold">Mot de passe oublié</h1>
      {envoye ? (
        <p className="mt-6 rounded-lg bg-white p-4">Si cette adresse correspond à un compte, un lien de réinitialisation vient d’être envoyé.</p>
      ) : (
        <form onSubmit={envoyer} className="mt-6 space-y-4">
          <input name="email" type="email" required placeholder="Votre e-mail" className="champ" />
          <button className="btn w-full">Envoyer le lien</button>
        </form>
      )}
    </main>
  );
}
