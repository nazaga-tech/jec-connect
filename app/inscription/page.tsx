"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Cat = "en_fonction" | "ancien";

export default function Inscription() {
  const [cat, setCat] = useState<Cat>("en_fonction");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur("");
    const f = new FormData(e.currentTarget);
    const data: Record<string, string> = { categorie: cat };
    f.forEach((v, k) => { if (typeof v === "string" && k !== "password") data[k] = v; });
    const { error } = await createClient().auth.signUp({
      email: String(f.get("email")), password: String(f.get("password")),
      options: { data, emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) return setErreur(error.message);
    setMessage("Demande envoyée ! Confirmez votre e-mail, puis connectez-vous pour ajouter votre photo. Un responsable validera ensuite votre compte.");
  }

  if (message) return (
    <main className="mx-auto max-w-lg px-4 py-16"><div className="carte-ui border-t-4 border-or p-8"><h1 className="text-2xl font-extrabold">Merci !</h1><p className="mt-2 text-slate-700">{message}</p></div></main>
  );

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">Rejoindre JEC CONNECT</h1>
      <p className="mt-1 text-slate-600">Tu es jéciste actif ou ancien jéciste ?</p>
      <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Catégorie">
        {([["en_fonction", "Jéciste actif"], ["ancien", "Ancien jéciste"]] as const).map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={cat === v} onClick={() => setCat(v)}
            className={`rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${cat === v ? "border-nuit bg-nuit text-white shadow-lg" : "border-slate-200 bg-white hover:border-ciel"}`}>{l}</button>
        ))}
      </div>
      <form onSubmit={envoyer} className="carte-ui mt-6 space-y-3 p-6">
        <div className="grid grid-cols-2 gap-3">
          <input name="prenom" required placeholder="Prénom" className="champ" />
          <input name="nom" required placeholder="Nom" className="champ" />
        </div>
        <input name="surnom" required placeholder="Surnom JEC" className="champ" />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">Date de naissance<input name="date_naissance" type="date" required className="champ mt-1" /></label>
          <label className="text-sm font-medium">Sexe<select name="sexe" required className="champ mt-1"><option value="F">Féminin</option><option value="M">Masculin</option></select></label>
        </div>
        <input name="email" type="email" required placeholder="E-mail" className="champ" />
        <input name="password" type="password" required minLength={8} placeholder="Mot de passe (8 caractères minimum)" className="champ" />
        <input name="annee_adhesion" type="number" required min={1950} max={2100} placeholder="Année d’adhésion" className="champ" />
        {cat === "en_fonction" ? (
          <label className="block text-sm font-medium">Rôle actuel
            <select name="role_demande" className="champ mt-1"><option value="membre">Membre</option><option value="respo">Respo Approbateur (à valider par l’administrateur)</option></select>
          </label>
        ) : (<>
          <input name="profession" required placeholder="Fonction professionnelle" className="champ" />
          <input name="telephone" type="tel" required placeholder="Numéro WhatsApp" className="champ" />
        </>)}
        <p className="rounded-lg bg-or/20 p-3 text-sm">📷 Votre photo de profil (obligatoire) sera demandée à votre première connexion.</p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required className="mt-1" /> J’accepte la <a href="/confidentialite" target="_blank" className="underline">politique de confidentialité</a> et les <a href="/conditions" target="_blank" className="underline">conditions d’utilisation</a>.
        </label>
        {erreur && <p role="alert" className="text-sm text-red-600">{erreur}</p>}
        <button className="btn w-full !py-3 text-lg">Envoyer ma demande</button>
      </form>
    </main>
  );
}
