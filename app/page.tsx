import Link from "next/link";
import Icone from "@/components/Icone";
import { createClient } from "@/lib/supabase/server";
import { lireVideo } from "@/lib/video";
import { JEC } from "@/lib/jec";

const fonctions: [string, string, string][] = [
  ["carte", "Ma carte de jéciste", "Une carte numérique à votre nom, avec votre slogan, à télécharger et à partager."],
  ["dossier", "Médiathèque", "Documents et comptes rendus, que chaque jéciste peut proposer pour tous."],
  ["mallette", "Opportunités", "Emplois, stages, bourses : publiés par la communauté, vérifiés par des responsables."],
  ["chat", "Communauté", "Chat général, groupes de discussion et messages privés."],
  ["jeux", "Jeux JEC", "Dames et QCM en ligne, points et classements du mois."],
  ["gateau", "Anniversaires", "Ne ratez plus l’anniversaire d’un camarade."],
];

export default async function Accueil() {
  const supabase = await createClient();
  const { data: regs } = await supabase.from("reglages").select("cle,valeur").in("cle", ["video_accueil", "apropos_intro", "apropos_ci"]);
  const reg = (c: string) => regs?.find((r) => r.cle === c)?.valeur;
  const video = reg("video_accueil") ? lireVideo(reg("video_accueil")!) : null;
  return (
    <main>
      <section className="fond-hero relative overflow-hidden text-white">
        <div className="trame absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-[1.15fr_1fr] md:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-or ring-1 ring-white/15">
              <span className="h-2 w-2 rounded-full bg-or" /> JEC · {JEC.nomLocal}
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
              Jécistes d’hier et d’aujourd’hui,<br /><span className="text-or">une seule famille.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-200">
              Retrouvez vos camarades, partagez vos parcours, entraidez-vous et faites vivre les valeurs de la JEC, de génération en génération.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/inscription" className="btn-or !px-7 !py-3.5 text-lg">Rejoindre la communauté</Link>
              <Link href="/login" className="rounded-xl border border-white/30 px-7 py-3.5 text-lg font-semibold transition hover:bg-white/10">Se connecter</Link>
            </div>
          </div>
          <div className="relative mx-auto hidden w-full max-w-sm md:block" aria-hidden="true">
            <div className="absolute -inset-6 rounded-[2rem] bg-or/20 blur-2xl" />
            <div className="relative rotate-3 rounded-3xl bg-gradient-to-br from-ciel to-nuit p-6 shadow-2xl ring-1 ring-white/20">
              <div className="flex items-center justify-between"><span className="font-serif text-xl font-extrabold">JEC</span><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Jéciste</span></div>
              <div className="mt-10 flex items-center gap-4">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-or font-serif text-3xl font-extrabold text-nuit">JC</span>
                <div><p className="text-xl font-bold">Prénom Nom</p><p className="text-slate-200">« Votre surnom »</p><p className="text-sm text-slate-300">Membre depuis 20XX</p></div>
              </div>
              <p className="mt-10 text-sm tracking-widest text-or">JEC-1000</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-or py-3 text-center font-serif text-lg font-extrabold tracking-wide text-nuit">VOIR · JUGER · AGIR</section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-ciel">La JEC en Côte d’Ivoire</p>
            <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Un mouvement qui forme des acteurs, pas des spectateurs.</h2>
            <p className="mt-5 text-slate-700">{reg("apropos_intro") ?? JEC.intro}</p>
            <p className="mt-4 text-slate-700">{reg("apropos_ci") ?? JEC.ci}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {JEC.faits.map(([k, v]) => (
              <div key={k} className="carte-ui border-t-4 border-or p-5">
                <p className="font-serif text-3xl font-extrabold text-ciel">{k}</p>
                <p className="mt-1 text-sm text-slate-600">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold md:text-4xl">La révision de vie, en trois temps</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[["eye", "Voir", "Observer honnêtement la réalité de son milieu : classe, école, quartier, famille."], ["juger", "Juger", "Éclairer ce qu’on a vu à la lumière de l’Évangile et de la foi."], ["agir", "Agir", "S’engager concrètement, ensemble, pour transformer ce qui doit l’être."]].map(([i, t, d], n) => (
              <div key={t} className="relative rounded-2xl bg-craie p-8 ring-1 ring-black/5">
                <span className="absolute right-6 top-4 font-serif text-6xl font-extrabold text-or/30">{n + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-nuit text-or"><Icone n={i} /></span>
                <h3 className="mt-5 text-2xl font-extrabold">{t}</h3>
                <p className="mt-2 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-ciel">JEC CONNECT</p>
        <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">Tout ce qu’il faut pour rester connecté</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {fonctions.map(([i, t, d]) => (
            <div key={t} className="carte-ui p-6 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-or/20 text-nuit"><Icone n={i} /></span>
              <h3 className="mt-4 text-xl font-bold">{t}</h3>
              <p className="mt-1 text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fond-hero text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">Découvrez la JEC en vidéo</h2>
          <div className="mt-8 aspect-video overflow-hidden rounded-2xl bg-black/40 shadow-2xl ring-1 ring-white/15">
            {video?.type === "youtube" && <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${video.id}`} title="Présentation de la JEC" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />}
            {video?.type === "fichier" && <video className="h-full w-full" src={video.url} controls preload="metadata" />}
            {!video && <div className="flex h-full items-center justify-center text-slate-300">La vidéo de présentation arrive bientôt.</div>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-3xl font-extrabold md:text-4xl">Prêt à rejoindre la famille jéciste ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Inscrivez-vous en 2 minutes. Un responsable valide chaque compte pour garder la communauté sûre.</p>
        <Link href="/inscription" className="btn-or mt-8 !px-8 !py-3.5 text-lg">Créer mon compte</Link>
      </section>
    </main>
  );
}
