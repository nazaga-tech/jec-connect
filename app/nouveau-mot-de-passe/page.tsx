"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Nouveau() {
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { error } = await createClient().auth.updateUser({ password: String(new FormData(e.currentTarget).get("password")) });
    if (error) return setErreur("Impossible de changer le mot de passe. Le lien a peut-être expiré : recommencez la demande.");
    router.push("/dashboard");
  }
  return (
    <main className="mx-auto max-w-sm px-4 py-14">
      <h1 className="font-serif text-3xl font-bold">Nouveau mot de passe</h1>
      <form onSubmit={envoyer} className="mt-6 space-y-4">
        <input name="password" type="password" required minLength={8} placeholder="Nouveau mot de passe (8 caractères minimum)" className="champ" />
        {erreur && <p role="alert" className="text-sm text-red-600">{erreur}</p>}
        <button className="btn w-full">Enregistrer</button>
      </form>
    </main>
  );
}
