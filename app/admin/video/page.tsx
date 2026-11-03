import { exigerStaff } from "@/lib/admin";
import { lireVideo } from "@/lib/video";
import { enregistrerVideo } from "../actions";

export default async function VideoAdmin() {
  const { supabase } = await exigerStaff(["super_admin"]);
  const { data } = await supabase.from("reglages").select("valeur").eq("cle", "video_accueil").maybeSingle();
  const v = data ? lireVideo(data.valeur) : null;
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Vidéo de la page d’accueil</h1>
      <form action={enregistrerVideo} className="carte-ui mt-6 space-y-3 p-5">
        <input name="url" defaultValue={data?.valeur ?? ""} placeholder="Lien YouTube, ou lien direct https://… .mp4" className="champ" />
        <p className="text-sm text-slate-500">Collez un lien YouTube (ou un fichier .mp4 / .webm hébergé en https). Laissez vide pour retirer la vidéo.</p>
        <button className="btn">Enregistrer</button>
      </form>
      {v?.type === "youtube" && <iframe className="mt-6 aspect-video w-full rounded-xl" src={`https://www.youtube-nocookie.com/embed/${v.id}`} title="Aperçu" allowFullScreen />}
      {v?.type === "fichier" && <video className="mt-6 w-full rounded-xl" src={v.url} controls />}
    </main>
  );
}
