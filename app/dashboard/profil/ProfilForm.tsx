"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProfilForm({ profil }: { profil: any }) {
  const supabase = createClient();
  const [p, setP] = useState(profil);
  const [info, setInfo] = useState("");
  const maj = (k: string, v: any) => setP({ ...p, [k]: v });

  async function envoyerPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 2 * 1024 * 1024) return setInfo("Choisissez une photo JPEG, PNG ou WebP de moins de 2 Mo.");
    const chemin = `${p.id}/avatar-${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(chemin, f, { contentType: f.type });
    if (error) return setInfo("Envoi de la photo impossible.");
    const url = supabase.storage.from("avatars").getPublicUrl(chemin).data.publicUrl;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", p.id);
    maj("avatar_url", url); setInfo("Photo mise à jour.");
  }
  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update({
      surnom: p.surnom, profession: p.profession, entreprise: p.entreprise, telephone: p.telephone,
      responsabilite: p.responsabilite, naissance_visible: p.naissance_visible,
    }).eq("id", p.id);
    setInfo(error ? "Enregistrement impossible." : "Profil enregistré.");
  }
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Mon profil</h1>
      <div className="mt-5 flex items-center gap-4">
        {p.avatar_url
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.avatar_url} alt="Ma photo" className="h-20 w-20 rounded-full object-cover" />
          : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-nuit text-2xl font-bold text-white">{p.prenom[0]}{p.nom[0]}</span>}
        <label className="btn cursor-pointer !py-1.5 text-sm">Changer ma photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={envoyerPhoto} className="sr-only" /></label>
      </div>
      <form onSubmit={enregistrer} className="mt-6 space-y-3">
        <input className="champ" placeholder="Surnom" value={p.surnom ?? ""} onChange={(e) => maj("surnom", e.target.value)} />
        {p.categorie === "ancien" ? (<>
          <input className="champ" placeholder="Fonction ou profession" value={p.profession ?? ""} onChange={(e) => maj("profession", e.target.value)} />
          <input className="champ" placeholder="Entreprise ou domaine" value={p.entreprise ?? ""} onChange={(e) => maj("entreprise", e.target.value)} />
          <input className="champ" type="tel" placeholder="Téléphone (jamais visible par les autres)" value={p.telephone ?? ""} onChange={(e) => maj("telephone", e.target.value)} />
        </>) : (
          <input className="champ" placeholder="Responsabilité actuelle" value={p.responsabilite ?? ""} onChange={(e) => maj("responsabilite", e.target.value)} />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={p.naissance_visible} onChange={(e) => maj("naissance_visible", e.target.checked)} />
          Afficher ma date d’anniversaire aux autres membres
        </label>
        <button className="btn">Enregistrer</button>
        {info && <p role="status" className="text-sm text-slate-600">{info}</p>}
      </form>
    </main>
  );
}
