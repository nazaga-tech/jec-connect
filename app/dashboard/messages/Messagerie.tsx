"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = { id: string; auteur: string; groupe_id: string | null; destinataire: string | null; texte: string; cree_le: string };
type Membre = { id: string; prenom: string; nom: string; surnom: string | null };
type Canal = { kind: "g" | "d"; id: string; nom: string };

export default function Messagerie({ moi, groupes, membres, bloquesInit }:
  { moi: string; groupes: { id: string; nom: string }[]; membres: Membre[]; bloquesInit: string[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [canal, setCanal] = useState<Canal | null>(groupes[0] ? { kind: "g", id: groupes[0].id, nom: groupes[0].nom } : null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texte, setTexte] = useState("");
  const [bloques, setBloques] = useState<string[]>(bloquesInit);
  const [info, setInfo] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  const noms = useMemo(() => Object.fromEntries(membres.map((m) => [m.id, m.surnom || m.prenom])), [membres]);

  useEffect(() => {
    if (!canal) return;
    const pertinent = (m: Msg) => canal.kind === "g" ? m.groupe_id === canal.id
      : (m.auteur === moi && m.destinataire === canal.id) || (m.auteur === canal.id && m.destinataire === moi);
    const q = supabase.from("messages").select("*").order("cree_le").limit(200);
    (canal.kind === "g" ? q.eq("groupe_id", canal.id)
      : q.or(`and(auteur.eq.${moi},destinataire.eq.${canal.id}),and(auteur.eq.${canal.id},destinataire.eq.${moi})`))
      .then(({ data }) => setMsgs((data as Msg[]) ?? []));
    const ch = supabase.channel(`msgs-${canal.kind}-${canal.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        const m = p.new as Msg;
        if (pertinent(m)) setMsgs((l) => (l.some((x) => x.id === m.id) ? l : [...l, m]));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [canal, moi, supabase]);

  useEffect(() => { fin.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!canal || !texte.trim()) return;
    const { data, error } = await supabase.from("messages")
      .insert(canal.kind === "g" ? { texte, groupe_id: canal.id } : { texte, destinataire: canal.id }).select().single();
    if (error) return setInfo("Message non envoyé (vous êtes peut-être bloqué par ce membre).");
    setInfo(""); setTexte("");
    setMsgs((l) => (l.some((x) => x.id === data.id) ? l : [...l, data as Msg]));
  }
  async function signaler(m: Msg) {
    const { error } = await supabase.from("signalements").insert({ cible: m.auteur, message_id: m.id });
    setInfo(error ? "Signalement impossible." : "Message signalé aux modérateurs.");
  }
  async function bloquer(id: string) {
    const { error } = await supabase.from("blocages").insert({ bloque: id });
    if (!error) { setBloques((b) => [...b, id]); setInfo("Membre bloqué."); }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-4 py-8 md:grid-cols-[14rem_1fr]">
      <aside className="space-y-4">
        <div>
          <h2 className="font-semibold">Groupes</h2>
          {groupes.map((g) => (
            <button key={g.id} onClick={() => setCanal({ kind: "g", id: g.id, nom: g.nom })}
              className={`block w-full rounded px-2 py-1 text-left ${canal?.id === g.id ? "bg-nuit text-white" : "hover:bg-slate-200"}`}># {g.nom}</button>
          ))}
        </div>
        <div>
          <h2 className="font-semibold">Messages privés</h2>
          <div className="max-h-72 overflow-y-auto">
            {membres.filter((m) => m.id !== moi && !bloques.includes(m.id)).map((m) => (
              <button key={m.id} onClick={() => setCanal({ kind: "d", id: m.id, nom: `${m.prenom} ${m.nom}` })}
                className={`block w-full rounded px-2 py-1 text-left ${canal?.id === m.id ? "bg-nuit text-white" : "hover:bg-slate-200"}`}>{m.prenom} {m.nom}</button>
            ))}
          </div>
        </div>
      </aside>
      <section className="flex h-[70vh] flex-col rounded-xl bg-white shadow-sm">
        <h1 className="border-b px-4 py-3 font-semibold">{canal ? canal.nom : "Choisissez une discussion"}</h1>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {msgs.filter((m) => !bloques.includes(m.auteur)).map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 ${m.auteur === moi ? "ml-auto bg-ciel/15" : "bg-craie"}`}>
              <p className="text-xs text-slate-500">{noms[m.auteur] ?? "Membre"} · {new Date(m.cree_le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              <p className="whitespace-pre-wrap">{m.texte}</p>
              {m.auteur !== moi && (
                <p className="mt-1 text-xs"><button onClick={() => signaler(m)} className="underline">Signaler</button>{" · "}
                  <button onClick={() => bloquer(m.auteur)} className="underline">Bloquer</button></p>
              )}
            </div>
          ))}
          <div ref={fin} />
        </div>
        {info && <p role="status" className="px-4 text-sm text-slate-600">{info}</p>}
        <form onSubmit={envoyer} className="flex gap-2 border-t p-3">
          <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={2000} placeholder="Votre message" className="champ" disabled={!canal} />
          <button className="btn" disabled={!canal}>Envoyer</button>
        </form>
      </section>
    </main>
  );
}
