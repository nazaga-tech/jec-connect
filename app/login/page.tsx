"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await createClient().auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    if (error) return setErreur("E-mail ou mot de passe incorrect, ou e-mail non vérifié.");
    router.push("/dashboard"); router.refresh();
  }
  return (
    <main className="fond-hero relative flex min-h-[80vh] items-center justify-center px-4 py-14">
      <div className="trame absolute inset-0" />
      <div className="carte-ui relative w-full max-w-sm p-8">
        <h1 className="text-3xl font-extrabold">Bon retour !</h1>
        <p className="mt-1 text-sm text-slate-500">Connectez-vous à JEC CONNECT.</p>
        <form onSubmit={envoyer} className="mt-6 space-y-4">
          <input name="email" type="email" required placeholder="E-mail" className="champ" />
          <input name="password" type="password" required placeholder="Mot de passe" className="champ" />
          {erreur && <p role="alert" className="text-sm text-red-600">{erreur}</p>}
          <button className="btn w-full !py-3">Se connecter</button>
          <p className="text-center text-sm"><Link href="/mot-de-passe-oublie" className="text-ciel underline">Mot de passe oublié ?</Link></p>
        </form>
        <p className="mt-6 border-t pt-4 text-center text-sm text-slate-600">Pas encore membre ? <Link href="/inscription" className="font-bold text-ciel">Rejoindre</Link></p>
      </div>
    </main>
  );
}
