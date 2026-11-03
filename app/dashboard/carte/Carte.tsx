"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { createClient } from "@/lib/supabase/client";

const FONDS = [
  "linear-gradient(135deg,#10213f,#2f6fb5)",
  "linear-gradient(135deg,#7a1f2b,#e0a528)",
  "linear-gradient(135deg,#14532d,#65a30d)",
  "linear-gradient(135deg,#312e81,#a855f7)",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Carte({ profil }: { profil: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [verso, setVerso] = useState(false);
  const [p, setP] = useState(profil);
  const [info, setInfo] = useState("");

  async function enregistrer() {
    const { error } = await createClient().from("profiles")
      .update({ slogan: p.slogan, presentation: p.presentation, devise: p.devise, fond_carte: p.fond_carte })
      .eq("id", p.id);
    setInfo(error ? "Enregistrement impossible." : "Carte enregistrée.");
  }
  async function telecharger() {
    if (!ref.current) return;
    const url = await toPng(ref.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = url; a.download = `carte-${p.matricule}-${verso ? "verso" : "recto"}.png`; a.click();
  }
  const maj = (k: string, v: any) => setP({ ...p, [k]: v });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Ma carte de jéciste</h1>
      <div ref={ref} style={{ background: FONDS[p.fond_carte] }}
        className="mt-6 aspect-[1.586] w-full max-w-md rounded-2xl p-6 text-white shadow-lg">
        {!verso ? (
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-bold">JEC</span>
              <span className="rounded bg-white/20 px-2 py-0.5 text-xs">{p.categorie === "ancien" ? "Ancien jéciste" : "Jéciste en fonction"}</span>
            </div>
            <div className="flex items-center gap-4">
              {p.avatar_url
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.avatar_url} alt="" crossOrigin="anonymous" className="h-20 w-20 rounded-full object-cover" />
                : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/25 text-3xl font-bold">
                    {(p.prenom?.[0] ?? "") + (p.nom?.[0] ?? "")}
                  </div>}
              <div>
                <p className="text-xl font-bold">{p.prenom} {p.nom}</p>
                {p.surnom && <p className="text-white/80">« {p.surnom} »</p>}
                <p className="text-sm text-white/80">Membre depuis {p.annee_adhesion}</p>
              </div>
            </div>
            <p className="text-sm tracking-wide">{p.matricule}</p>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-center gap-3 text-center">
            <p className="font-serif text-xl font-bold">{p.slogan || "Mon slogan"}</p>
            <p className="text-sm text-white/90">{p.presentation || "Ma présentation"}</p>
            <p className="italic text-white/80">{p.devise || "Ma devise"}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setVerso(!verso)} className="btn">Voir le {verso ? "recto" : "verso"}</button>
        <button onClick={telecharger} className="btn-or">Télécharger en image</button>
        <button onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold">Imprimer / PDF</button>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="font-semibold">Personnaliser le verso et le fond</h2>
        <input className="champ" placeholder="Slogan personnel" value={p.slogan ?? ""} onChange={(e) => maj("slogan", e.target.value)} />
        <textarea className="champ" rows={3} placeholder="Petite présentation" value={p.presentation ?? ""} onChange={(e) => maj("presentation", e.target.value)} />
        <input className="champ" placeholder="Citation ou devise" value={p.devise ?? ""} onChange={(e) => maj("devise", e.target.value)} />
        <div className="flex gap-2" role="radiogroup" aria-label="Fond de la carte">
          {FONDS.map((f, i) => (
            <button key={i} role="radio" aria-checked={p.fond_carte === i} aria-label={`Fond ${i + 1}`} onClick={() => maj("fond_carte", i)}
              style={{ background: f }} className={`h-10 w-10 rounded-full ${p.fond_carte === i ? "ring-4 ring-or" : ""}`} />
          ))}
        </div>
        <button onClick={enregistrer} className="btn">Enregistrer ma carte</button>
        {info && <p role="status" className="text-sm text-slate-600">{info}</p>}
      </section>
    </main>
  );
}
