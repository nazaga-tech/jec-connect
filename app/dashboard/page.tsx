import { redirect } from "next/navigation";
import Link from "next/link";
import Icone from "@/components/Icone";
import { createClient } from "@/lib/supabase/server";

const rubriques: [string, string, string][] = [
  ["carte", "Ma carte", "/dashboard/carte"], ["actu", "Actualités", "/dashboard/actualites"],
  ["dossier", "Médiathèque", "/dashboard/documents"], ["mallette", "Opportunités", "/dashboard/opportunites"],
  ["chat", "Communauté", "/dashboard/messages"], ["jeux", "Jeux", "/dashboard/jeux"],
  ["gateau", "Anniversaires", "/dashboard/anniversaires"], ["cloche", "Notifications", "/dashboard/notifications"],
  ["annuaire", "Annuaire", "/dashboard/annuaire"], ["profil", "Mon profil", "/dashboard/profil"],
];

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!p) redirect("/login");
  const staff = ["super_admin", "validateur", "moderateur"].includes(p.role);
  return (
    <main>
      <section className="fond-hero relative text-white">
        <div className="trame absolute inset-0" />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-or" />
            <div><h1 className="text-3xl font-extrabold">Bonjour {p.surnom || p.prenom} 👋</h1><p className="text-slate-300">Identifiant jéciste : {p.matricule}</p></div>
          </div>
          {staff && <Link href={p.role === "moderateur" ? "/admin/moderation" : "/admin"} className="btn-or">Administration</Link>}
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {rubriques.map(([i, t, h]) => (
          <Link key={t} href={h} className="carte-ui group flex flex-col items-start gap-3 p-5 transition hover:-translate-y-1 hover:shadow-xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-or/20 text-nuit transition group-hover:bg-nuit group-hover:text-or"><Icone n={i} /></span>
            <span className="font-bold">{t}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
